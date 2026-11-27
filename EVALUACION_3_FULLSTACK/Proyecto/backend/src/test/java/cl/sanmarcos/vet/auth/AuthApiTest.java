package cl.sanmarcos.vet.auth;

import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
    "spring.datasource.url=jdbc:h2:mem:auth_test;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop","app.seed.enabled=false","app.admin.password=admin123"
})
class AuthApiTest {
    @Value("${local.server.port}") int port;
    @Autowired UserRepository users;
    @Autowired SessionRepository sessions;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtEncoder encoder;
    @Autowired JwtDecoder decoder;
    @Autowired cl.sanmarcos.vet.repository.ProductRepository products;
    final ObjectMapper mapper=new ObjectMapper();
    record Response(int status,String body,String cookie) {}
    Response call(String method,String path,Object data,String token,String cookie,String origin) throws Exception {
        var c=(HttpURLConnection) URI.create("http://127.0.0.1:"+port+path).toURL().openConnection();
        c.setRequestMethod(method);
        if (origin!=null) c.setRequestProperty("Origin",origin);
        if (token!=null) c.setRequestProperty("Authorization","Bearer "+token);
        if (cookie!=null) c.setRequestProperty("Cookie",cookie);
        if (data!=null) {
            c.setRequestProperty("Content-Type","application/json"); c.setDoOutput(true);
            try (var out=c.getOutputStream()) { out.write(mapper.writeValueAsString(data).getBytes(StandardCharsets.UTF_8)); }
        }
        int status=c.getResponseCode(); var stream=status>=400?c.getErrorStream():c.getInputStream();
        String body=stream==null?"":new String(stream.readAllBytes(),StandardCharsets.UTF_8);
        if (stream!=null) stream.close();
        var result=new Response(status,body,c.getHeaderField("Set-Cookie")); c.disconnect(); return result;
    }
    Response call(String method,String path,Object data,String token) throws Exception {
        return call(method,path,data,token,null,"http://localhost:3000");
    }
    String token(Response r) { assertEquals(200,r.status,r.body); return mapper.readTree(r.body).get("accessToken").asText(); }
    String cookie(Response r) { return r.cookie.split(";",2)[0]; }
    String email() { return UUID.randomUUID()+"@gmail.com"; }
    Map<String,Object> registration(String email,String role) {
        return Map.of("email",email,"password","prueba123","name","Ana","lastName","Pérez","run","190110222",
            "region","O’Higgins","commune","Rancagua","address","Calle 1","role",role);
    }
    Response login(String email,String password) throws Exception {
        return call("POST","/api/v1/auth/login",Map.of("email",email,"password",password),null);
    }
    String admin() throws Exception { return token(login("admin@gmail.com","admin123")); }
    @Test void registrationPersistsHashedPasswordAndCannotAssignAdmin() throws Exception {
        String email=email(); var r=call("POST","/api/v1/auth/register",registration(email,"Administrador"),null);
        assertEquals(201,r.status,r.body); assertFalse(r.body.contains("password"));
        AppUser u=users.findByEmail(email).orElseThrow();
        assertEquals("Cliente",u.role.name); assertNotEquals("prueba123",u.passwordHash);
        assertTrue(passwords.matches("prueba123",u.passwordHash));
        assertEquals(409,call("POST","/api/v1/auth/register",registration(email,"Cliente"),null).status);
        var invalid=new HashMap<>(registration(email(),"Cliente")); invalid.put("run","19011022K");
        assertEquals(400,call("POST","/api/v1/auth/register",invalid,null).status);
        invalid.put("run","190110222"); invalid.put("password","1234");
        assertEquals(400,call("POST","/api/v1/auth/register",invalid,null).status);
    }
    @Test void loginSignsJwtAndStoresOnlyRefreshHash() throws Exception {
        var r=login("admin@gmail.com","admin123"); String token=token(r);
        Jwt jwt=decoder.decode(token); assertEquals("vet-api",jwt.getClaimAsString("iss"));
        assertEquals("Administrador",jwt.getClaimAsString("role"));
        assertTrue(jwt.getExpiresAt().isAfter(Instant.now()));
        assertTrue(r.cookie.contains("HttpOnly")); assertTrue(r.cookie.contains("SameSite=Strict"));
        assertTrue(r.cookie.contains("Path=/api/v1/auth")); assertFalse(r.body.contains("refreshToken"));
        AuthSession s=sessions.findById(jwt.getClaimAsString("sid")).orElseThrow();
        assertEquals(64,s.refreshHash.length()); assertFalse(cookie(r).contains(s.refreshHash));
        assertEquals(200,call("GET","/api/v1/auth/me",null,token).status);
        assertEquals(401,login("admin@gmail.com","incorrecta").status);
    }
    @Test void refreshRestoresSessionRotatesAndRejectsReplay() throws Exception {
        var login=login("admin@gmail.com","admin123");
        var refresh=call("POST","/api/v1/auth/refresh",null,null,cookie(login),"http://localhost:3000");
        assertEquals(200,refresh.status,refresh.body); assertNotEquals(cookie(login),cookie(refresh));
        assertEquals(200,call("GET","/api/v1/auth/me",null,token(refresh)).status);
        assertEquals(401,call("POST","/api/v1/auth/refresh",null,null,cookie(login),"http://localhost:3000").status);
    }
    @Test void logoutRevokesAccessAndRefreshTokens() throws Exception {
        var login=login("admin@gmail.com","admin123"); String token=token(login);
        var logout=call("POST","/api/v1/auth/logout",null,null,cookie(login),"http://localhost:3000");
        assertEquals(204,logout.status); assertTrue(logout.cookie.contains("Max-Age=0"));
        assertEquals(401,call("GET","/api/v1/auth/me",null,token).status);
        assertEquals(401,call("POST","/api/v1/auth/refresh",null,null,cookie(login),"http://localhost:3000").status);
    }
    @Test void allRolesAreEnforcedOnServerAndUserResponsesHideHashes() throws Exception {
        String admin=admin();
        for (String role : List.of("Vendedor","Cliente")) {
            String email=email();
            assertEquals(201,call("POST","/api/v1/users",registration(email,role),admin).status);
            String token=token(login(email,"prueba123"));
            assertEquals(200,call("GET","/api/v1/products",null,token).status);
            assertEquals(403,call("GET","/api/v1/users",null,token).status);
            assertEquals(403,call("POST","/api/v1/users",registration(email(),"Administrador"),token).status);
            assertEquals(403,call("POST","/api/v1/products",Map.of(),token).status);
            assertEquals(403,call("GET","/api/v1/encomienda",null,token).status);
        }
        var list=call("GET","/api/v1/users",null,admin);
        assertEquals(200,list.status); assertFalse(list.body.contains("password")); assertFalse(list.body.contains("$2a$"));
        assertEquals(401,call("GET","/api/v1/users",null,null).status);
    }
    @Test void roleChangesAndDeletionRevokeExistingSessions() throws Exception {
        String admin=admin(),email=email();
        var created=call("POST","/api/v1/users",registration(email,"Vendedor"),admin);
        String id=mapper.readTree(created.body).get("id").asText();
        var first=login(email,"prueba123");
        assertEquals(200,call("PUT","/api/v1/users/"+id+"/role",Map.of("role","Cliente"),admin).status);
        assertEquals(401,call("GET","/api/v1/auth/me",null,token(first)).status);
        assertEquals(401,call("POST","/api/v1/auth/refresh",null,null,cookie(first),"http://localhost:3000").status);
        var second=login(email,"prueba123"); assertTrue(second.body.contains("Cliente"));
        assertEquals(204,call("DELETE","/api/v1/users/"+id,null,admin).status);
        assertEquals(401,call("GET","/api/v1/auth/me",null,token(second)).status);
        assertEquals(401,login(email,"prueba123").status);
        String own=decoder.decode(admin).getSubject();
        assertEquals(409,call("DELETE","/api/v1/users/"+own,null,admin).status);
        assertEquals(409,call("PUT","/api/v1/users/"+own+"/role",Map.of("role","Cliente"),admin).status);
    }
    @Test void expiredAndForgedTokensAreRejected() throws Exception {
        Jwt valid=decoder.decode(admin());
        JwtClaimsSet expired=JwtClaimsSet.builder().issuer("vet-api").subject(valid.getSubject())
            .issuedAt(Instant.now().minusSeconds(120)).expiresAt(Instant.now().minusSeconds(60))
            .claim("sid",valid.getClaimAsString("sid")).build();
        String token=encoder.encode(JwtEncoderParameters.from(expired)).getTokenValue();
        assertEquals(401,call("GET","/api/v1/auth/me",null,token).status);
        assertEquals(401,call("GET","/api/v1/auth/me",null,"forged.jwt.token").status);
        AuthSession s=sessions.findById(valid.getClaimAsString("sid")).orElseThrow();
        s.expiresAt=Instant.now().minusSeconds(1); sessions.save(s);
        assertEquals(401,call("GET","/api/v1/auth/me",null,valid.getTokenValue()).status);
    }
    @Test void cookieActionsRejectMissingAndUntrustedOrigins() throws Exception {
        var login=login("admin@gmail.com","admin123");
        for (String origin : Arrays.asList(null,"http://evil.example")) {
            assertEquals(403,call("POST","/api/v1/auth/refresh",null,null,cookie(login),origin).status);
            assertEquals(403,call("POST","/api/v1/auth/logout",null,null,cookie(login),origin).status);
            assertEquals(403,call("POST","/api/v1/auth/login",Map.of("email","admin@gmail.com","password","admin123"),null,null,origin).status);
        }
    }
    String product(String admin,int stock) throws Exception {
        var r=call("POST","/api/v1/products",Map.of("code","QA-"+UUID.randomUUID(),"name","Producto QA","category","Alimentos","price",1500,"stock",stock,"critical",1),admin);
        assertEquals(201,r.status,r.body); return mapper.readTree(r.body).get("id").asText();
    }
    Map<String,Object> cart(String id,int qty,String requestId) {
        return Map.of("requestId",requestId,"items",List.of(Map.of("id",id,"quantity",qty)));
    }
    String client() throws Exception {
        String email=email(); assertEquals(201,call("POST","/api/v1/auth/register",registration(email,"Cliente"),null).status);
        return token(login(email,"prueba123"));
    }
    @Test void ordersCalculatePricesPersistSnapshotsAndDeduplicateRetries() throws Exception {
        String admin=admin(),client=client(),id=product(admin,10),key=UUID.randomUUID().toString();
        var input=new HashMap<>(cart(id,2,key)); input.put("total",1);
        var r=call("POST","/api/v1/orders",input,client); assertEquals(201,r.status,r.body);
        var order=mapper.readTree(r.body); String orderId=order.get("id").asText();
        assertEquals(3000,order.get("total").asInt()); assertEquals(8,products.findById(id).orElseThrow().getStock());
        var retry=call("POST","/api/v1/orders",input,client);
        assertEquals(orderId,mapper.readTree(retry.body).get("id").asText()); assertEquals(8,products.findById(id).orElseThrow().getStock());
        assertEquals(409,call("POST","/api/v1/orders",cart(id,3,key),client).status);
        var p=products.findById(id).orElseThrow(); p.setPrice(new java.math.BigDecimal("9999")); products.save(p);
        var detail=call("GET","/api/v1/orders/"+orderId,null,client);
        assertEquals(1500,mapper.readTree(detail.body).get("items").get(0).get("price").asInt());
        assertEquals(409,call("DELETE","/api/v1/products/"+id,null,admin).status);
        assertEquals(404,call("GET","/api/v1/orders/"+orderId,null,client()).status);
    }
    @Test void failedOrdersRollbackStockAndValidateQuantities() throws Exception {
        String admin=admin(),client=client(),a=product(admin,4),b=product(admin,0);
        var data=Map.of("requestId",UUID.randomUUID().toString(),"items",List.of(Map.of("id",a,"quantity",2),Map.of("id",b,"quantity",1)));
        assertEquals(409,call("POST","/api/v1/orders",data,client).status);
        assertEquals(4,products.findById(a).orElseThrow().getStock());
        assertEquals(400,call("POST","/api/v1/orders",cart(a,0,UUID.randomUUID().toString()),client).status);
        assertEquals(400,call("POST","/api/v1/orders",Map.of("requestId",UUID.randomUUID().toString(),"items",List.of()),client).status);
        assertEquals(401,call("POST","/api/v1/orders",cart(a,1,UUID.randomUUID().toString()),null).status);
    }
    @Test void orderPermissionsCancellationAndDeletion() throws Exception {
        String admin=admin(),client=client(),id=product(admin,4),email=email();
        call("POST","/api/v1/users",registration(email,"Vendedor"),admin); String seller=token(login(email,"prueba123"));
        var r=call("POST","/api/v1/orders",cart(id,2,UUID.randomUUID().toString()),client);
        String orderId=mapper.readTree(r.body).get("id").asText(),path="/api/v1/orders/"+orderId;
        assertEquals(200,call("GET",path,null,seller).status);
        assertEquals(200,call("GET","/api/v1/orders",null,seller).status);
        assertEquals(403,call("POST","/api/v1/orders",cart(id,1,UUID.randomUUID().toString()),seller).status);
        for (String actor : List.of(client,seller)) {
            assertEquals(403,call("PUT",path,Map.of("status","CANCELADA"),actor).status);
            assertEquals(403,call("DELETE",path,null,actor).status);
        }
        assertEquals(409,call("DELETE",path,null,admin).status);
        assertEquals(200,call("PUT",path,Map.of("status","CANCELADA"),admin).status);
        assertEquals(4,products.findById(id).orElseThrow().getStock());
        assertEquals(200,call("PUT",path,Map.of("status","CANCELADA"),admin).status);
        assertEquals(4,products.findById(id).orElseThrow().getStock());
        assertEquals(409,call("PUT",path,Map.of("status","ENTREGADA"),admin).status);
        assertEquals(204,call("DELETE",path,null,admin).status);
        assertEquals(404,call("GET",path,null,admin).status);
    }
    @Test void concurrentCustomersCannotOversellLastUnit() throws Exception {
        String admin=admin(),id=product(admin,1),one=client(),two=client();
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            var start=new java.util.concurrent.CountDownLatch(1);
            var a=pool.submit(() -> { start.await(); return call("POST","/api/v1/orders",cart(id,1,UUID.randomUUID().toString()),one).status; });
            var b=pool.submit(() -> { start.await(); return call("POST","/api/v1/orders",cart(id,1,UUID.randomUUID().toString()),two).status; });
            start.countDown(); var results=new ArrayList<>(List.of(a.get(),b.get())); Collections.sort(results);
            assertEquals(List.of(201,409),results); assertEquals(0,products.findById(id).orElseThrow().getStock());
        } finally { pool.shutdownNow(); }
    }
    @Test void parallelRetriesCreateOnlyOneOrder() throws Exception {
        String admin=admin(),id=product(admin,5),client=client(),key=UUID.randomUUID().toString();
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            var a=pool.submit(() -> call("POST","/api/v1/orders",cart(id,2,key),client));
            var b=pool.submit(() -> call("POST","/api/v1/orders",cart(id,2,key),client));
            var first=a.get(); var second=b.get(); assertEquals(201,first.status,first.body); assertEquals(201,second.status,second.body);
            assertEquals(mapper.readTree(first.body).get("id").asText(),mapper.readTree(second.body).get("id").asText());
            assertEquals(3,products.findById(id).orElseThrow().getStock());
        } finally { pool.shutdownNow(); }
    }
}

