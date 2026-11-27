package cl.sanmarcos.vet.encomiendas;

import java.net.URI;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/encomienda")
@Tag(name="Dinobox", description="Registro, seguimiento público y gestión de encomiendas")
public class EncomiendaController {
    private final EncomiendaService servicio;
    public EncomiendaController(EncomiendaService servicio) { this.servicio = servicio; }

    @PostMapping @Operation(summary="Registrar una encomienda y obtener su código")
    public ResponseEntity<Solicitudes.Seguimiento> crear(@Valid @RequestBody Solicitudes.Alta datos) {
        var guia = servicio.crear(datos);
        return ResponseEntity.created(URI.create("/api/v1/encomienda/" + guia.codigo())).body(guia);
    }
    @GetMapping("/{codigo}") @Operation(summary="Consultar el recorrido mediante el código de seguimiento")
    public Solicitudes.Seguimiento consultar(@PathVariable String codigo) { return servicio.buscar(codigo); }
    @GetMapping @SecurityRequirement(name="bearerAuth") @Operation(summary="Listar solicitudes")
    public List<Encomienda> listar() { return servicio.listar(); }
    @PutMapping("/{codigo}") @SecurityRequirement(name="bearerAuth") @Operation(summary="Registrar la siguiente etapa y su ubicación")
    public Solicitudes.Seguimiento editar(@PathVariable String codigo, @Valid @RequestBody Solicitudes.Cambio datos) {
        return servicio.actualizar(codigo, datos);
    }
    @DeleteMapping("/{codigo}") @SecurityRequirement(name="bearerAuth") @Operation(summary="Eliminar una solicitud y su historial")
    public ResponseEntity<Void> eliminar(@PathVariable String codigo) {
        servicio.eliminar(codigo);
        return ResponseEntity.noContent().build();
    }
}

