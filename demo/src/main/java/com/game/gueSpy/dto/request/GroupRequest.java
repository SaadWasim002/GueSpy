package com.game.gueSpy.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GroupRequest {
    @JsonProperty("group_name")
    private String groupName;

    @JsonProperty("players")
    private List<String> players;
}