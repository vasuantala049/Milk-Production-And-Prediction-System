package com.example.backend.Controller;
import com.example.backend.DTO.UserPatchDto;
import com.example.backend.DTO.UserResponseDto;
import com.example.backend.DTO.WorkerFarmInvitationDto;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.FarmService;
import jakarta.validation.Valid;
import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final FarmService farmService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createNewUser(
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createNewUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserResponseDto> patchUser(
            @PathVariable Long id,
            @RequestBody UserPatchDto patchDto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(userService.patchUser(id, patchDto, user));
    }

    @GetMapping("/db-test")
    public String testDb() {
        userRepository.count();
        return "DB OK";
    }

    // Worker: get pending farm invitations
    @GetMapping("/me/invitations")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<List<WorkerFarmInvitationDto>> getMyInvitations(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.getPendingInvitationsForWorker(user));
    }

    // Worker: accept or decline an invitation
    @PostMapping("/me/invitations/{invitationId}/respond")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<WorkerFarmInvitationDto> respondToInvitation(
            @PathVariable Long invitationId,
            @RequestParam boolean accept,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.respondToInvitation(invitationId, accept, user));
    }
}
