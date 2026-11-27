package cl.sanmarcos.vet.exception;

import java.util.Map;
import java.util.LinkedHashMap;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<?> status(org.springframework.web.server.ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()==null ? "Solicitud rechazada." : e.getReason()));
    }
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> notFound(ResourceNotFoundException e) { return ResponseEntity.status(404).body(Map.of("error", e.getMessage())); }
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<?> conflict(ConflictException e) { return ResponseEntity.status(409).body(Map.of("error", e.getMessage())); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> integrity(DataIntegrityViolationException e) { return ResponseEntity.status(409).body(Map.of("error", "El registro ya existe o tiene datos relacionados.")); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("error", "Revisa los campos indicados.", "fields", fields));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> invalidJson(HttpMessageNotReadableException e) { return ResponseEntity.badRequest().body(Map.of("error", "JSON inválido o tipos de datos incorrectos.")); }
}
