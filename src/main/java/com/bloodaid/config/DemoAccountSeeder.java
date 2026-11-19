package com.bloodaid.config;

import com.bloodaid.domain.BloodBank;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.UserRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates one demo account per role on startup (only if missing). Passwords are hashed with BCrypt
 * here, which is why this is code and not part of the Flyway SQL seed.
 * Disable with APP_SEED_ENABLED=false for any real deployment.
 */
@Component
public class DemoAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountSeeder.class);

    public static final String ADMIN_EMAIL = "admin@bloodaid.test";
    public static final String STAFF_EMAIL = "staff@bloodaid.test";
    public static final String DONOR_EMAIL = "donor@bloodaid.test";
    public static final String RECIPIENT_EMAIL = "recipient@bloodaid.test";
    public static final String DEMO_PASSWORD = "Demo@12345";

    private final UserRepository users;
    private final BloodBankRepository banks;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public DemoAccountSeeder(UserRepository users, BloodBankRepository banks, PasswordEncoder passwordEncoder,
                             @Value("${app.seed.enabled:true}") boolean enabled) {
        this.users = users;
        this.banks = banks;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        List<BloodBank> allBanks = banks.findAll();
        Long firstBankId = allBanks.isEmpty() ? null : allBanks.get(0).getId();

        create(ADMIN_EMAIL, "Demo Admin", Role.ADMIN, null, null, null);
        create(STAFF_EMAIL, "Demo Staff", Role.STAFF, null, firstBankId, "EMP-1001");
        create(DONOR_EMAIL, "Demo Donor", Role.DONOR, "O+", null, null);
        create(RECIPIENT_EMAIL, "Demo Recipient", Role.RECIPIENT, null, null, null);
        log.info("Demo accounts are enabled (password '{}'). Set APP_SEED_ENABLED=false for real deployments.",
                DEMO_PASSWORD);
    }

    private void create(String email, String name, Role role, String bloodType, Long bankId, String employeeId) {
        if (users.existsByEmail(email)) {
            return;
        }
        User u = new User();
        u.setEmail(email);
        u.setFullName(name);
        u.setRole(role);
        u.setBloodType(bloodType);
        u.setBankId(bankId);
        u.setEmployeeId(employeeId);
        u.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
        users.save(u);
    }
}
