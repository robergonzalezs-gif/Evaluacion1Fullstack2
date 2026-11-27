package cl.sanmarcos.vet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "Veterinaria San Marcos", version = "3.0", description = "CRUD de productos veterinarios. Lectura pública; escritura con cuenta administradora."))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class VetApplication {
    public static void main(String[] args) { SpringApplication.run(VetApplication.class, args); }
}
