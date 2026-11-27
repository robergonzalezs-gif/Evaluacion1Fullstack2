package cl.sanmarcos.vet;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.net.http.*;
import java.util.Base64;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:apitest;DB_CLOSE_DELAY=-1", "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.seed.enabled=false", "app.admin.password=admin123"
})
class ProductApiTest {
    @Value("${local.server.port}") int port;
    record Response(int statusCode, String body, java.util.Map<String, java.util.List<String>> headers) {
        String header(String name) { return headers.entrySet().stream().filter(e -> name.equalsIgnoreCase(e.getKey())).flatMap(e -> e.getValue().stream()).findFirst().orElse(null); }
    }
    Response send(String method, String path, String body, java.util.Map<String,String> headers) throws Exception {
        var connection = (java.net.HttpURLConnection) URI.create("http://127.0.0.1:" + port + path).toURL().openConnection();
        connection.setRequestMethod(method);
        headers.forEach(connection::setRequestProperty);
        if (body != null) { connection.setDoOutput(true); connection.getOutputStream().write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
        int status = connection.getResponseCode();
        var stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
        String result = stream == null ? "" : new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        if (stream != null) stream.close();
        var response = new Response(status, result, connection.getHeaderFields()); connection.disconnect(); return response;
    }
    final ObjectMapper mapper = new ObjectMapper();
    String product(String code, String name, int stock) {
        return "{\"code\":\"" + code + "\",\"name\":\"" + name + "\",\"category\":\"Alimentos\",\"price\":1500,\"stock\":" + stock + ",\"critical\":2}";
    }
    Response call(String method, String path, String body, boolean admin) throws Exception {
        var headers = new java.util.HashMap<String,String>();
        if (admin) {
            var login=send("POST","/api/v1/auth/login","{\"email\":\"admin@gmail.com\",\"password\":\"admin123\"}",
                java.util.Map.of("Content-Type","application/json","Origin","http://localhost:3000"));
            assertEquals(200,login.statusCode(),login.body());
            headers.put("Authorization","Bearer "+mapper.readTree(login.body()).get("accessToken").asText());
        }
        if (body != null) headers.put("Content-Type", "application/json");
        return send(method,path,body,headers);
    }
    @Test void completeCrudAndNotFound() throws Exception {
        var created = call("POST", "/api/v1/products", product("CRUD-1", "Alimento prueba", 5), true);
        assertEquals(201, created.statusCode(), created.body());
        String id = mapper.readTree(created.body()).get("id").asText();
        assertEquals("/api/v1/products/" + id, created.header("Location"));
        assertEquals(200, call("GET", "/api/v1/products/" + id, null, false).statusCode());
        assertTrue(call("GET", "/api/v1/products?search=Alimento", null, false).body().contains(id));
        var updated = call("PUT", "/api/v1/products/" + id, product("CRUD-1", "Actualizado", 3), true);
        assertEquals(200, updated.statusCode());
        assertEquals("Actualizado", mapper.readTree(updated.body()).get("name").asText());
        var deleted = call("DELETE", "/api/v1/products/" + id, null, true);
        assertEquals(204, deleted.statusCode()); assertEquals("", deleted.body());
        assertEquals(404, call("GET", "/api/v1/products/" + id, null, false).statusCode());
        assertEquals(404, call("PUT", "/api/v1/products/" + id, product("CRUD-1", "Otro", 3), true).statusCode());
        assertEquals(404, call("DELETE", "/api/v1/products/" + id, null, true).statusCode());
    }
    @Test void validatesFieldsAndRejectsDuplicates() throws Exception {
        assertEquals(400, call("POST", "/api/v1/products", product("BAD", "", -1), true).statusCode());
        assertEquals(400, call("POST", "/api/v1/products", "{", true).statusCode());
        var created = call("POST", "/api/v1/products", product("DUP-1", "Duplicado", 1), true);
        assertEquals(201, created.statusCode());
        assertEquals(409, call("POST", "/api/v1/products", product("dup-1", "Duplicado", 1), true).statusCode());
    }
    @Test void protectsWritesAndDocumentsApi() throws Exception {
        assertEquals(401, call("POST", "/api/v1/products", product("SEC-1", "Producto", 1), false).statusCode());
        assertEquals(401, call("PUT", "/api/v1/products/no-id", product("SEC-1", "Producto", 1), false).statusCode());
        assertEquals(401, call("DELETE", "/api/v1/products/no-id", null, false).statusCode());
        assertEquals(401, call("GET", "/api/session", null, false).statusCode());
        assertEquals(200, call("GET", "/api/session", null, true).statusCode());
        var docs = call("GET", "/v3/api-docs", null, false);
        assertEquals(200, docs.statusCode(), docs.body()); assertTrue(docs.body().contains("/api/v1/products"));
        assertEquals(200, call("GET", "/swagger-ui/index.html", null, false).statusCode());
    }
    @Test void corsAllowsFrontendPreflightAndRejectsOtherOrigins() throws Exception {
        for (String origin : new String[]{"http://localhost:3000", "http://untrusted.example"}) {
            var response = send("OPTIONS", "/api/v1/products", null, java.util.Map.of("Origin", origin,
                "Access-Control-Request-Method", "POST", "Access-Control-Request-Headers", "content-type,authorization"));
            if (origin.contains("localhost")) {
                assertEquals(200, response.statusCode());
                assertEquals(origin, response.header("Access-Control-Allow-Origin"));
            } else { assertEquals(403, response.statusCode()); assertNull(response.header("Access-Control-Allow-Origin")); }
        }
    }
}

