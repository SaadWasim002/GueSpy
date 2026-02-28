package com.game.gueSpy.dto.response;

import com.game.gueSpy.dto.GenericResponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=true)
@AllArgsConstructor
public class RoleRevealResponse extends GenericResponse{
    private ScreenData screenData;
}
