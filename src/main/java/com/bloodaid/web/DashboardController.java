package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.StatsService;
import com.bloodaid.service.UserService;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final StatsService stats;
    private final UserService users;

    public DashboardController(StatsService stats, UserService users) {
        this.stats = stats;
        this.users = users;
    }

    @GetMapping("/staff/stats")
    public Dtos.StaffStats staffStats(Principal principal) {
        return stats.staffStats(principal.getName());
    }

    @GetMapping("/admin/stats")
    public Dtos.AdminStats adminStats() {
        return stats.adminStats();
    }

    @GetMapping("/admin/users")
    public List<Dtos.UserDto> adminUsers(@RequestParam(defaultValue = "20") int limit) {
        return users.recentUsers(Math.max(1, Math.min(limit, 100)));
    }
}
