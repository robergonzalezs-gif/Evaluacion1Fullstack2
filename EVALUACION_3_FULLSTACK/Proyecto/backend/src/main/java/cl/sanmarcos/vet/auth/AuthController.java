package cl.sanmarcos.vet.auth;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name="Autenticación", description="JWT de acceso y renovación mediante cookie HttpOnly")
public class AuthController {
    private final AuthService service;
    private final Set<String> origins;
    private final boolean secure;
    private final long refreshSeconds;
    public AuthController(AuthService service, @Value("${app.auth.origins:${app.cors.origins}}") String origins,
        @Value("${app.auth.cookie-secure:false}") boolean secure,
        @Value("${app.jwt.refresh-seconds:604800}") long refreshSeconds) {
        this.service=service; this.origins=new HashSet<>();
        Arrays.stream(origins.split(",")).map(String::trim).forEach(this.origins::add);
        this.secure=secure; this.refreshSeconds=refreshSeconds;
    }
    // Cookie-authenticated actions require an exact trusted origin, including login CSRF.
    private void checkOrigin(HttpServletRequest request) {
        if (!origins.contains(request.getHeader("Origin")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Origen no permitido para autenticación.");
    }
    private String cookie(String token, long seconds) {
        return ResponseCookie.from("vet_refresh",token).httpOnly(true).secure(secure).sameSite("Strict")
            .path("/api/v1/auth").maxAge(seconds).build().toString();
    }
    private ResponseEntity<?> tokens(AuthService.Tokens tokens) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL,"no-store")
            .header(HttpHeaders.SET_COOKIE,cookie(tokens.refreshToken(),refreshSeconds))
            .body(Map.of("accessToken",tokens.accessToken(),"user",tokens.user()));
    }
    @PostMapping("/register") public ResponseEntity<?> register(@Valid @RequestBody AuthService.Registration data,HttpServletRequest request) {
        checkOrigin(request); return ResponseEntity.status(201).body(service.register(data,false));
    }
    @PostMapping("/login") public ResponseEntity<?> login(@Valid @RequestBody AuthService.Login data,HttpServletRequest request) {
        checkOrigin(request); return tokens(service.login(data));
    }
    @PostMapping("/refresh") public ResponseEntity<?> refresh(@CookieValue(name="vet_refresh",required=false) String token,HttpServletRequest request) {
        checkOrigin(request); return tokens(service.refresh(token));
    }
    @PostMapping("/logout") public ResponseEntity<?> logout(@CookieValue(name="vet_refresh",required=false) String token,HttpServletRequest request) {
        checkOrigin(request); service.logout(token);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,cookie("",0)).build();
    }
    @GetMapping("/me") public AuthService.UserView me(@AuthenticationPrincipal Jwt jwt) { return AuthService.view(service.authenticated(jwt)); }
}
