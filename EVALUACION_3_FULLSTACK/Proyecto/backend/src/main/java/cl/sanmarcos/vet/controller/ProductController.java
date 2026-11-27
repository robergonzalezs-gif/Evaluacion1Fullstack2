package cl.sanmarcos.vet.controller;

import cl.sanmarcos.vet.model.Product;
import cl.sanmarcos.vet.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping({"/api/v1/products", "/api/products"})
@Tag(name = "Productos", description = "Catálogo veterinario persistido mediante JPA")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }
    @GetMapping @Operation(summary = "Listar productos o buscar por texto")
    public List<Product> all(@RequestParam(required = false) String search) { return service.findAll(search); }
    @GetMapping("/{id}") @Operation(summary = "Obtener un producto")
    public Product one(@PathVariable String id) { return service.findById(id); }
    @PostMapping @Operation(summary = "Crear producto", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        Product created = service.create(product);
        return ResponseEntity.created(URI.create("/api/v1/products/" + created.getId())).body(created);
    }
    @PutMapping("/{id}") @Operation(summary = "Actualizar producto", security = @SecurityRequirement(name = "bearerAuth"))
    public Product update(@PathVariable String id, @Valid @RequestBody Product product) { return service.update(id, product); }
    @DeleteMapping("/{id}") @Operation(summary = "Eliminar producto", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}

