export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Manejar preflight CORS (seguridad de los navegadores)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Nombre del archivo quitando el "/" inicial

    // 1. SERVIR IMAGEN (GET https://tu-worker.workers.dev/nombre-archivo.jpg)
    if (request.method === "GET") {
      if (!key || key === "") {
        return new Response("Bienvenido al pipeline de imágenes de VenezuelaSOS", {
          status: 200,
          headers: { "Content-Type": "text/plain", ...corsHeaders }
        });
      }

      try {
        const object = await env.IMAGES_BUCKET.get(key);
        if (object === null) {
          return new Response("Imagen no encontrada", { status: 404, headers: corsHeaders });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        // Cachear en el navegador del usuario final por 1 semana para no re-descargar
        headers.set("Cache-Control", "public, max-age=604800"); 
        
        // Copiar las cabeceras CORS
        for (const [k, v] of Object.entries(corsHeaders)) {
          headers.set(k, v);
        }

        return new Response(object.body, { headers });
      } catch (err) {
        return new Response("Error al obtener la imagen: " + err.message, { status: 500, headers: corsHeaders });
      }
    }

    // 2. SUBIR IMAGEN (POST https://tu-worker.workers.dev/upload?file=nombre-archivo.jpg)
    if (request.method === "POST") {
      if (url.pathname !== "/upload") {
        return new Response("Ruta no permitida", { status: 404, headers: corsHeaders });
      }

      try {
        const fileParam = url.searchParams.get("file");
        if (!fileParam) {
          return new Response("Falta el parámetro 'file' en la URL", { status: 400, headers: corsHeaders });
        }

        // Leer el cuerpo binario de la imagen enviada desde React
        const blob = await request.blob();
        if (blob.size === 0) {
          return new Response("El archivo está vacío", { status: 400, headers: corsHeaders });
        }

        // Guardar la foto en Cloudflare R2
        await env.IMAGES_BUCKET.put(fileParam, blob, {
          httpMetadata: {
            contentType: request.headers.get("content-type") || "image/jpeg"
          }
        });

        // La URL pública para acceder a la foto será el propio Worker + nombre-archivo
        const publicUrl = `${url.origin}/${fileParam}`;

        return new Response(JSON.stringify({ url: publicUrl }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Método no permitido", { status: 405, headers: corsHeaders });
  }
};
