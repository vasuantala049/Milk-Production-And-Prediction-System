package com.example.backend.Service.impl;

import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.DTO.UserResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserResponseDto createNewUser(CreateUserRequestDto addUserRequestDto) {
        User newUser = modelMapper.map(addUserRequestDto,User.class);
        User user = userRepository.save(newUser);
        return modelMapper.map(user, UserResponseDto.class);
    }

    @Override
    public List<UserResponseDto> getUserById(Long id) {
        List<User> users = userRepository.findUsersById((id));
        return users
                .stream()
                .map(user -> new UserResponseDto(user.getId(),user.getName(),user.getEmail(),user.getRole(),user.getCreatedAt()))
                .toList();
    }

    @Override
    public UserResponseDto updateUser(Long id, CreateUserRequestDto request) {
        User user = userRepository.findById(id).orElseThrow(()->new IllegalArgumentException("user not found with id"+id));
        modelMapper.map(request,user);
        user = userRepository.save(user);
        return modelMapper.map(user,UserResponseDto.class);
    }

    @Override
    public UserResponseDto patchUser(Long id, Map<String, Object> updates ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("user not found with id " + id));

        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            String field = entry.getKey();
            Object value = entry.getValue();

            switch (field) {
                case "name":
                    user.setName((String) value);
                    break;
                case "email":
                    user.setEmail((String) value);
                    break;
                default:
                    throw new IllegalArgumentException("field not supported: " + field);
            }
        }

        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }
}
