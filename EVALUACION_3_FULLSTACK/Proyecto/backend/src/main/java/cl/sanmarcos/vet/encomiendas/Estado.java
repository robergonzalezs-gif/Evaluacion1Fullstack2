package cl.sanmarcos.vet.encomiendas;

public enum Estado {
    RECEPCION, DESPACHO, TRANSITO, ENTREGADO;

    boolean siguiente(Estado nuevo) {
        return ordinal() + 1 == nuevo.ordinal();
    }
}
