package cl.sanmarcos.vet.encomiendas;

import java.util.*;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import cl.sanmarcos.vet.exception.*;

@Service
@Transactional
public class EncomiendaService {
    private final EncomiendaRepository repo;
    private final EntityManager em;
    public EncomiendaService(EncomiendaRepository repo, EntityManager em) {
        this.repo = repo;
        this.em = em;
    }
    public Solicitudes.Seguimiento crear(Solicitudes.Alta datos) {
        String codigo;
        do {
            codigo = "DB-" + UUID.randomUUID().toString().replace("-", "").substring(0,16).toUpperCase(Locale.ROOT);
        } while (repo.existsById(codigo));
        var envio = new Encomienda(codigo, datos);
        em.persist(envio);
        return seguimiento(envio);
    }
    @Transactional(readOnly = true)
    public Solicitudes.Seguimiento buscar(String codigo) {
        return seguimiento(repo.findById(normalizar(codigo)).orElseThrow(this::ausente));
    }
    @Transactional(readOnly = true)
    public List<Encomienda> listar() {
        var lista = repo.findAll();
        lista.forEach(envio -> envio.getHistorial());
        return lista;
    }
    public Solicitudes.Seguimiento actualizar(String codigo, Solicitudes.Cambio datos) {
        // El bloqueo serializa dos actualizaciones simultáneas de la misma guía.
        var envio = repo.paraActualizar(normalizar(codigo)).orElseThrow(this::ausente);
        if (!envio.getEstado().siguiente(datos.estado()))
            throw new ConflictException("Solo se puede registrar la siguiente etapa del viaje.");
        envio.registrar(datos.estado(), datos.ubicacion());
        return seguimiento(envio);
    }
    public void eliminar(String codigo) {
        repo.delete(repo.paraActualizar(normalizar(codigo)).orElseThrow(this::ausente));
    }
    private String normalizar(String codigo) { return codigo.strip().toUpperCase(Locale.ROOT); }
    private ResourceNotFoundException ausente() { return new ResourceNotFoundException("No encontramos una encomienda con ese código."); }
    private Solicitudes.Seguimiento seguimiento(Encomienda envio) {
        return new Solicitudes.Seguimiento(envio.getCodigo(), envio.getEstado(), envio.getHistorial());
    }
}
