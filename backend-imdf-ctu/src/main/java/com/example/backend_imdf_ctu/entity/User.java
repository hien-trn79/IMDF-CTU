package com.example.backend_imdf_ctu.entity;

import com.example.backend_imdf_ctu.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "username")
    private String username;

    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@(.+)$", message = "Email không hợp lệ")
    @Column(name = "email")
    private String email;

    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,255}$", message = "Password phải chứa chữ hoa, chữ thường và số")
    @Column(name = "password")
    private String password;

    @Column(name = "full_name")
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role;

    @Column(name = "is_active", columnDefinition = "boolean default true")
    private boolean isActive;

    @Column(name = "number_phone")
    private String numberPhone;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
