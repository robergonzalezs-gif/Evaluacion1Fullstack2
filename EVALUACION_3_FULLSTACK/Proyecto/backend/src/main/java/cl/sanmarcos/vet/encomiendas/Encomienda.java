package cl.sanmarcos.vet.encomiendas;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "encomienda")
public class Encomienda {
    @Id @Column(length = 20)
    private String codigo;
    @Column(nullable = false, length = 100)
    private String origen;
    @Column(nullable = false, length = 100)
    private String destino;
    @Column(nullable = false, length = 200)
    private String descripcion;
    @ElementCollection
    @CollectionTable(name = "evento_encomienda", joinColumns = @JoinColumn(name = "codigo"))
    @OrderColumn(name = "secuencia")
    private List<Evento> historial = new ArrayList<>();

    protected Encomienda() {}
    Encomienda(String codigo, Solicitudes.Alta datos) {
        this.codigo = codigo;
        origen = datos.origen().strip();
        destino = datos.destino().strip();
        descripcion = datos.descripcion().strip();
        registrar(Estado.RECEPCION, origen);
    }
    void registrar(Estado estado, String ubicacion) {
        historial.add(new Evento(estado, ubicacion.strip(), Instant.now()));
    }
    public String getCodigo() { return codigo; }
    public String getOrigen() { return origen; }
    public String getDestino() { return destino; }
    public String getDescripcion() { return descripcion; }
    public Estado getEstado() { return historial.get(historial.size()-1).getEstado(); }
    public List<Evento> getHistorial() { return List.copyOf(historial); }
}
