package cl.sanmarcos.vet.encomiendas;

import jakarta.persistence.*;
import java.time.Instant;

@Embeddable
public class Evento {
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15)
    private Estado estado;
    @Column(nullable = false, length = 100)
    private String ubicacion;
    @Column(nullable = false)
    private Instant fecha;
    protected Evento() {}
    Evento(Estado estado, String ubicacion, Instant fecha) {
        this.estado = estado;
        this.ubicacion = ubicacion;
        this.fecha = fecha;
    }
    public Estado getEstado() { return estado; }
    public String getUbicacion() { return ubicacion; }
    public Instant getFecha() { return fecha; }
}
