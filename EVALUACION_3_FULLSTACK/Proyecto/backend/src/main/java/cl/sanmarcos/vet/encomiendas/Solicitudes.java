package cl.sanmarcos.vet.encomiendas;

import jakarta.validation.constraints.*;

public class Solicitudes {
    public record Alta(
        @NotBlank @Size(max=100) String origen,
        @NotBlank @Size(max=100) String destino,
        @NotBlank @Size(max=200) String descripcion) {}
    public record Cambio(@NotNull Estado estado, @NotBlank @Size(max=100) String ubicacion) {}
    // El seguimiento público muestra solo los datos necesarios para seguir el viaje.
    public record Seguimiento(String codigo, Estado estado, java.util.List<Evento> historial) {}
}
