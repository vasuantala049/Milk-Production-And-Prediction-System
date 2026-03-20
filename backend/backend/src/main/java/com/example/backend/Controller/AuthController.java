package com.example.backend.Controller;

import com.example.backend.DTO.*;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Security.JwtTokenProvider;
import com.example.backend.Service.impl.EmailServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final ModelMapper modelMapper;
    private final FarmRepository farmRepository;
    private final EmailServiceImpl emailService;
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody @Valid CreateUserRequestDto request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAddress(normalize(request.getAddress()));
        user.setCity(normalize(request.getCity()));
        user.setLocation(normalize(request.getAddress()));

                // 🔥 ROLE-BASED LOGIC (this was missing)
                if (request.getRole() == UserRole.WORKER) {
                        // If a farmId was provided (owner-driven), assign it; otherwise worker remains unassigned
                        if (request.getFarmId() != null) {
                                Farm farm = farmRepository.findById(request.getFarmId())
                                                .orElseThrow(() -> new RuntimeException("Farm not found"));
                                java.util.List<Farm> farms = new java.util.ArrayList<>();
                                farms.add(farm);
                                user.setFarms(farms);
                        }
                }

        if (request.getRole() == UserRole.FARM_OWNER) {
            Farm farm = new Farm();
            farm.setName(request.getFarm().getName());
            farm.setAddress(request.getFarm().getAddress());
                        farm.setCity(request.getFarm().getCity());
            farm.setOwner(user);
            user.setFarms(List.of(farm));
        }

        User savedUser = userRepository.save(user);
        emailService.sendRegistrationSuccessEmail(savedUser.getEmail(), savedUser.getName());

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(savedUser.getEmail());

        String token = jwtTokenProvider.generateToken(userDetails);

        UserResponseDto userResponse = toUserResponse(savedUser);
        AuthResponseDto response = AuthResponseDto.builder()
                .token(token)
                .user(userResponse)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody @Valid LoginRequestDto request) {
        // Authenticate user
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Load user and generate token
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtTokenProvider.generateToken(userDetails);

        // Get user entity for response
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserResponseDto userResponse = toUserResponse(user);
        AuthResponseDto response = AuthResponseDto.builder()
                .token(token)
                .user(userResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/request-otp")
    public ResponseEntity<Map<String, String>> requestPasswordResetOtp(
            @RequestBody @Valid ForgotPasswordRequestDto request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String otp = String.format("%06d", new Random().nextInt(1_000_000));
            user.setPasswordResetOtp(otp);
            user.setPasswordResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);
            emailService.sendPasswordResetOtp(user.getEmail(), user.getName(), otp);
        });

        return ResponseEntity.ok(Map.of("message", "If this email exists, an OTP has been sent"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, String>> resetPasswordWithOtp(
            @RequestBody @Valid ResetPasswordWithOtpRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid OTP or email"));

        if (user.getPasswordResetOtp() == null
                || user.getPasswordResetOtpExpiry() == null
                || LocalDateTime.now().isAfter(user.getPasswordResetOtpExpiry())
                || !user.getPasswordResetOtp().equals(request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid or expired OTP"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetOtp(null);
        user.setPasswordResetOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

        private UserResponseDto toUserResponse(User user) {
                UserResponseDto response = modelMapper.map(user, UserResponseDto.class);
                if ((response.getAddress() == null || response.getAddress().isBlank())
                                && user.getLocation() != null
                                && !user.getLocation().isBlank()) {
                        response.setAddress(user.getLocation());
                }
                return response;
        }

        private String normalize(String value) {
                if (value == null) {
                        return null;
                }
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }
}

