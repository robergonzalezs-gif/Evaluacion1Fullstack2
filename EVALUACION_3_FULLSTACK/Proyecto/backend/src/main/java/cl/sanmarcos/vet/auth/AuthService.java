package cl.sanmarcos.vet.auth;

import cl.sanmarcos.vet.exception.ConflictException;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthService {
    public record Registration(
        @NotBlank @Email @Size(max=100) @Pattern(regexp="(?i)[^@]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)") String email,
        @NotBlank @Size(min=8, max=64) String password,
        @NotBlank @Size(max=50) String name,
        @NotBlank @Size(max=100) String lastName,
        @NotBlank @Pattern(regexp="[0-9]{7,8}[0-9Kk]") String run,
        @Size(max=10) String birthDate,
        @NotBlank @Size(max=100) String region,
        @NotBlank @Size(max=100) String commune,
        @NotBlank @Size(max=300) String address,
        String role) {
        public Registration {
            if (email!=null) email=email.trim().toLowerCase(Locale.ROOT);
            if (run!=null) run=run.trim().toUpperCase(Locale.ROOT);
        }
    }
    public record Login(@NotBlank @Email String email, @NotBlank @Size(max=64) String password) {}
    public record UserView(String id, String email, String name, String lastName, String role) {}
    public record Tokens(String accessToken, UserView user, String refreshToken) {}
    private final UserRepository users;
    private final RoleRepository roles;
    private final SessionRepository sessions;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    private final String dummyHash;
    private final long accessSeconds;
    private final long refreshSeconds;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository users, RoleRepository roles, SessionRepository sessions, PasswordEncoder passwords,
        JwtEncoder encoder, @Value("${app.jwt.access-seconds:900}") long accessSeconds,
        @Value("${app.jwt.refresh-seconds:604800}") long refreshSeconds) {
        this.users=users; this.roles=roles; this.sessions=sessions; this.passwords=passwords; this.encoder=encoder;
        this.accessSeconds=accessSeconds; this.refreshSeconds=refreshSeconds;
        dummyHash=passwords.encode(UUID.randomUUID().toString());
    }
    @Bean
    ApplicationRunner seedAccounts(@Value("${app.admin.password}") String adminPassword,
        @Value("${app.seller.password:}") String sellerPassword) {
        return args -> {
            for (String name : List.of("Administrador", "Vendedor", "Cliente"))
                if (!roles.existsById(name)) roles.save(new Role(name));
            seed("admin@gmail.com", "Administración", adminPassword, "Administrador");
            if (!sellerPassword.isBlank()) seed("vendedor@gmail.com", "Ventas", sellerPassword, "Vendedor");
        };
    }
    private void seed(String email, String name, String password, String role) {
        if (users.existsByEmail(email)) return;
        if (password.length()<8 || password.length()>64 || password.getBytes(StandardCharsets.UTF_8).length>72)
            throw new IllegalArgumentException("La contraseña inicial debe tener de 8 a 64 caracteres y hasta 72 bytes UTF-8.");
        AppUser u=new AppUser(); u.email=email; u.name=name; u.lastName="";
        u.passwordHash=passwords.encode(password); u.role=roles.findById(role).orElseThrow(); users.save(u);
    }
    public static UserView view(AppUser u) { return new UserView(u.id,u.email,u.name,u.lastName,u.role.name); }
    public UserView register(Registration r, boolean admin) {
        if (r.password().getBytes(StandardCharsets.UTF_8).length>72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La contraseña supera el límite de 72 bytes UTF-8.");
        String email=r.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw new ConflictException("Ya existe una cuenta con ese correo.");
        if (!validRun(r.run())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"RUN inválido.");
        AppUser u=new AppUser(); u.email=email; u.passwordHash=passwords.encode(r.password());
        u.name=r.name().trim(); u.lastName=r.lastName().trim(); u.run=r.run().toUpperCase(Locale.ROOT);
        u.birthDate=r.birthDate(); u.region=r.region(); u.commune=r.commune(); u.address=r.address();
        u.role=role(admin && r.role()!=null ? r.role() : "Cliente");
        return view(users.saveAndFlush(u));
    }
    private boolean validRun(String run) {
        int sum=0, factor=2;
        for (int i=run.length()-2;i>=0;i--) { sum+=(run.charAt(i)-'0')*factor; factor=factor==7?2:factor+1; }
        int check=11-sum%11;
        return run.substring(run.length()-1).equalsIgnoreCase(check==11?"0":check==10?"K":String.valueOf(check));
    }
    private Role role(String role) {
        return roles.findById(role).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rol inválido."));
    }
    public Tokens login(Login login) {
        if (login.password().getBytes(StandardCharsets.UTF_8).length>72) throw unauthorized();
        AppUser u=users.findByEmail(login.email().trim().toLowerCase(Locale.ROOT)).orElse(null);
        boolean matches=passwords.matches(login.password(),u==null?dummyHash:u.passwordHash);
        if (u==null || !matches) throw unauthorized();
        AuthSession s=new AuthSession(); s.user=u; s.expiresAt=Instant.now().plusSeconds(refreshSeconds);
        return rotate(s);
    }
    public Tokens refresh(String token) {
        AuthSession s=sessions.findByRefreshHash(hash(token)).orElseThrow(AuthService::unauthorized);
        if (!s.expiresAt.isAfter(Instant.now())) throw unauthorized();
        return rotate(s);
    }
    private Tokens rotate(AuthSession s) {
        byte[] bytes=new byte[32]; random.nextBytes(bytes);
        String refresh=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        s.refreshHash=hash(refresh); sessions.saveAndFlush(s);
        Instant now=Instant.now();
        JwtClaimsSet claims=JwtClaimsSet.builder().issuer("vet-api").subject(s.user.id).issuedAt(now)
            .expiresAt(now.plusSeconds(accessSeconds)).claim("sid",s.id).claim("role",s.user.role.name).build();
        return new Tokens(encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue(),view(s.user),refresh);
    }
    public void logout(String token) {
        if (token!=null && !token.isBlank()) sessions.findByRefreshHash(hash(token)).ifPresent(sessions::delete);
    }
    @Transactional(readOnly=true)
    public AppUser authenticated(Jwt jwt) {
        AuthSession s=sessions.findById(jwt.getClaimAsString("sid")).orElseThrow(AuthService::unauthorized);
        if (!s.expiresAt.isAfter(Instant.now()) || !s.user.id.equals(jwt.getSubject())) throw unauthorized();
        return s.user;
    }
    @Transactional(readOnly=true)
    public List<UserView> listUsers() { return users.findAll().stream().map(AuthService::view).toList(); }
    public UserView changeRole(String id, String name, String actor) {
        if (id.equals(actor)) throw new ConflictException("No puedes cambiar tu propio rol.");
        AppUser u=users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Usuario no encontrado."));
        u.role=role(name); sessions.deleteByUserId(id); return view(u);
    }
    public void deleteUser(String id, String actor) {
        if (id.equals(actor)) throw new ConflictException("No puedes eliminar tu propia cuenta.");
        AppUser u=users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Usuario no encontrado."));
        sessions.deleteByUserId(id); sessions.flush(); users.delete(u);
    }
    static ResponseStatusException unauthorized() { return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Sesión inválida o credenciales incorrectas."); }
    static String hash(String value) {
        if (value==null || value.isBlank()) throw unauthorized();
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
