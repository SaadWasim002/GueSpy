package com.game.gueSpy.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GroupRequest {
    @NotBlank
    @JsonProperty("group_name")
    private String groupName;

    @NotEmpty
    @JsonProperty("players")
    private List<String> players;
}