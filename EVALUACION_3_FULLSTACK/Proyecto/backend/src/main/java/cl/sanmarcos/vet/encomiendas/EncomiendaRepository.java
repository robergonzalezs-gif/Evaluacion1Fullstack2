package cl.sanmarcos.vet.encomiendas;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface EncomiendaRepository extends JpaRepository<Encomienda,String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Encomienda e where e.codigo = :codigo")
    Optional<Encomienda> paraActualizar(@Param("codigo") String codigo);
}
