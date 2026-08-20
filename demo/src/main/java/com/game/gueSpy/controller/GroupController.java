package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.GroupService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping(
        name = "Create a group",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody GroupRequest request){
        return groupService.createNewGroup(request, principal.userId());
    }

    @GetMapping(
        name = "Get all groups",
        produces = "application/json"
    )
    public ResponseEntity<?> getAll(@AuthenticationPrincipal UserPrincipal principal){
        return groupService.getAllGroupForTheUser(principal.userId(), null);
    }

    @GetMapping(
        path = "/{id}",
        name = "Get a specific group",
        produces = "application/json"
    )
    public ResponseEntity<?> getOne(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id){
        return groupService.getAllGroupForTheUser(principal.userId(), id);
    }

    @PostMapping(
        path = "/{id}/select",
        name = "Select a group",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id){
        return groupService.selectGroup(principal.userId(), id);
    }

    @PutMapping(
        path = "/{id}",
        name = "Update a group",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id, @Valid @RequestBody GroupRequest request){
        return groupService.updateGroup(request, id, principal.userId());
    }

    @DeleteMapping(
        path = "/{id}",
        name = "Delete a group",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id){
        return groupService.deleteGroup(id, principal.userId());
    }
}
