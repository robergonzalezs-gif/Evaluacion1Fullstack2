package cl.sanmarcos.vet.auth;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name="bearerAuth")
@Tag(name="Usuarios",description="Administración de usuarios y roles persistidos")
public class UserController {
    private final AuthService service;
    public UserController(AuthService service) { this.service=service; }
    public record RoleChange(@NotBlank String role) {}
    @GetMapping public List<AuthService.UserView> list() { return service.listUsers(); }
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody AuthService.Registration data) {
        return ResponseEntity.status(201).body(service.register(data,true));
    }
    @PutMapping("/{id}/role") public AuthService.UserView role(@PathVariable String id,
        @Valid @RequestBody RoleChange data,@AuthenticationPrincipal Jwt jwt) {
        return service.changeRole(id,data.role(),jwt.getSubject());
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable String id,@AuthenticationPrincipal Jwt jwt) {
        service.deleteUser(id,jwt.getSubject()); return ResponseEntity.noContent().build();
    }
}
