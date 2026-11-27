package cl.sanmarcos.vet.controller;
import cl.sanmarcos.vet.auth.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
@RestController
public class SessionController {
    private final AuthService service;
    public SessionController(AuthService service) { this.service=service; }
    @GetMapping("/api/session") @SecurityRequirement(name="bearerAuth")
    public AuthService.UserView session(@AuthenticationPrincipal Jwt jwt) {
        return AuthService.view(service.authenticated(jwt));
    }
}
