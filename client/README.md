# GueSpy Frontend Product Requirements Document (PRD)

## 1. Introduction

### 1.1. Purpose
This document outlines the product requirements for the GueSpy frontend application. The primary goal is to create a sleek, modern, minimalist, and dark-themed user interface that facilitates user authentication and the initial game setup flow, specifically category selection.

### 1.2. Scope
This PRD covers the full single-device (pass-and-play) game flow:
- User Authentication: Registration and Login (logout is client-side only).
- Game setup: determining game state, starting/resetting a game, category selection, group (player list) selection, and game options (number of spies).
- Gameplay: word & spy reveal, discussion timer, voting, and the multi-round outcome flow — revote, spy guess, round end, and the final scoring/result screen.
- Global Error Handling.

The game is currently **single-device pass-and-play**: one authenticated user drives all players on one device. Future phases will cover an ADMIN interface and (eventually) multi-device play.

### 1.3. Target Audience
This document is intended for frontend developers, UI/UX designers, and quality assurance engineers involved in the GueSpy project.

## 2. UI/UX Design Principles

### 2.1. Visual Style
- **Theme**: Dark mode, minimalist design.
- **Aesthetics**: Sleek, modern, and clean. Emphasis on clear typography, subtle animations, and intuitive layouts.
- **Color Palette**: Predominantly dark backgrounds with contrasting, muted accent colors for interactive elements and text. Avoid overly bright or distracting elements.
- **Typography**: Use a legible, modern sans-serif font.
- **Iconography**: Simple, clear icons to enhance usability without clutter.

### 2.2. Component Reusability
- All UI components (e.g., buttons, input fields, modals, loading indicators, error messages) must be designed and implemented for maximum reusability across the application. This ensures consistency, reduces development time, and simplifies maintenance.

## 3. Functional Requirements

This section details the functional requirements of the application. All successful API responses that return data follow a consistent structure where the payload is nested under a `data` key, alongside `message` and `status` keys.

### 3.1. Authentication Module

#### 3.1.1. User Registration
- **Description**: Allows new users to create an account.
- **UI**: A dedicated registration screen with input fields for:
    - Username
    - Email
    - Password (with a "Show/Hide Password" toggle)
    - Confirm Password
- **Actions**:
    - "Register" button: Submits the form.
    - "Already have an account? Login": Navigates to the login screen.
- **API Endpoint**: `POST http://localhost:8080/api/v1/auth/register`
    - **Request**: `{ "username": "...", "email": "...", "password": "..." }`
    - **Success (201 CREATED)**: Display a success message, store the received JWT token from the `data.token` field, and sign the user straight in — the token is immediately usable, so asking for the same credentials again is pure friction.

      ✅ The registration token now carries the `userId` claim — `AuthService.userRegister` saves the user before generating the token, so the id is present. A registration token decodes to `{sub, role, userId, iat, exp}`, identical in shape to a login token.
        ```json
        {
            "data": {
                "token": "eyJhbGciOiJIUzI1NiJ9..."
            },
            "message": "User registered successfully",
            "status": "201 CREATED"
        }
        ```
    - **Error (409 CONFLICT)**: Display "User already exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Some fields are missing or invalid."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.2. User Login
- **Description**: Allows existing users to log in.
- **UI**: A dedicated login screen with input fields for:
    - Email
    - Password (with a "Show/Hide Password" toggle)
- **Actions**:
    - "Login" button: Submits the form.
    - "Don't have an account? Register": Navigates to the registration screen.
- **API Endpoint**: `POST http://localhost:8080/api/v1/auth/login`
    - **Request**: `{ "email": "...", "password": "..." }`
    - **Success (200 OK)**: Display "Login Successful", store the received JWT token from the `data.token` field, and extract the `userId` from it. Redirect to the Initial Game Screen.
        ```json
        {
            "data": {
                "token": "eyJhbGciOiJIUzI1NiJ9..."
            },
            "message": "Login Successful",
            "status": "200 OK"
        }
        ```
    - **Error (401 UNAUTHORIZED)**: Display "Incorrect email or password."
    - **Error (404 NOT_FOUND)**: Display "No user exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Email and password are required."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.3. User Logout
- **Description**: Allows a logged-in user to end their session.
- **UI**: A "Logout" button or link, typically accessible from a user profile menu or header.
- **Actions**:
    - On click: Clears the stored JWT token from client-side storage and redirects to the Login/Registration screen.
- **API Endpoint**: None. Authentication is **stateless JWT**, so there is no `/auth/logout` endpoint — logout is purely client-side (discard the stored token). The token naturally expires after ~1 hour.

### 3.2. Game Initialization & Category Selection Module

#### 3.2.0. Game Selection Screen (Games List)
- **Description**: The platform's entry point after login. Lists the games available so the user can choose one. GueSpy is currently the only game, but this screen is built to grow.
- **UI**:
    - A list/grid of game cards, each showing the game's `name` (and `description`).
    - Only games with `"enabled": true` are shown; each card is selectable.
- **Data source**: `GET http://localhost:8080/api/v1/configs` → the config with `key: "active_games"`, whose `value` is a JSON array (string):
    ```json
    [
        { "gameType": "GUESPY", "name": "GueSpy", "description": "Word-based spy party game", "enabled": true }
    ]
    ```
- **Logic**:
    - Fetch configs, find `active_games`, `JSON.parse` its value, and render the enabled games.
    - Selecting **GueSpy** enters the game flow: call `GET /api/v1/game/state` and route by `gameStatus` (see 3.2.3).
    - The backend currently associates every session with GueSpy automatically, so no separate "select game" API call is required yet. `gameType` is included on each entry so that, as more games are added, the frontend can route each game to its own flow.
- **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Fall back to showing GueSpy only.
- **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.1. Initial Game Screen
- **Description**: The first screen a user sees after logging in or after a game reset, offering options to continue or start fresh.
- **UI**: A central screen with two prominent, distinct buttons:
    - "Continue Game"
    - "New Game"
- **Logic**: This screen is displayed after the frontend determines the current game status via `GET /game-engine/game-state`.

#### 3.2.2. New Game Flow
- **Description**: Resets the user's current game progress and starts a new game.
- **Trigger**: User clicks the "New Game" button.
- **API Endpoint**: `POST http://localhost:8080/api/v1/game/reset`
    - **Request Headers**:  `Authorization: Bearer <token>` 
    - **Success (200 OK)**: Upon successful reset, the frontend must immediately call `GET /api/v1/game/state`. In practice this returns **`NOT_STARTED`**, not `CATEGORY_SELECTION` — both mean "pick a category", and the routing table below already maps them to the same screen.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.3. Current Screen Determination
- **Description**: Determines the user's current game state and navigates to the appropriate screen. This API call is crucial and should be made:
    1.  Immediately after successful login.
    2.  Immediately after a successful "New Game" reset.
- **API Endpoint**: `GET http://localhost:8080/api/v1/game/state`
    - **Request Headers**:  `Authorization: Bearer <token>`
    - **Expected Response**: `gameStatus` is **inside** the `data` object, not a sibling of it. The server returns a `GameStatusData` object *as* the payload, so every response looks like:
        ```json
        { "data": { "gameStatus": "NOT_STARTED" }, "message": "Game Status loaded successfully", "status": "200 OK" }
        ```
        State-specific fields (`discussionStartTime`, `players`, `winner`, …) sit alongside `gameStatus` in that same `data` object. *(Corrected against a running backend — earlier revisions of this document showed `gameStatus` at the response root, which would read as `undefined`.)*
    - **Logic**:
        - The frontend will navigate to the appropriate screen based on the `gameStatus` value.
        - `NOT_STARTED` or `CATEGORY_SELECTION`: Navigate to Category Selection Screen.
        - `GROUP_SELECTION`: Navigate to Group Selection Screen.
        - `GAME_OPTION_SELECTION`: Navigate to Game Option Selection Screen.
        - `WORD_AND_SPY_REVEAL`: Navigate to Word and Spy Reveal Screen.
        - `DISCUSSION_TIME`: Navigate to Discussion Time Screen.
        - `VOTING` or `REVOTE`: Navigate to Voting Screen.
        - `SPY_GUESS`: Navigate to Spy Guess Screen (see 3.2.12).
        - `ROUND_END`: Navigate to Round End Screen (see 3.2.13).
        - `SCORING`: Navigate to Scoring / Result Screen (see 3.2.14).
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.4. Category Selection Screen
- **Description**: Allows the user to browse and select a game category.
- **UI**:
    - A clear title: "Select a Category".
    - A scrollable list or grid of available categories. Each category item should display its `categoryName`.
    - Each category item should be clickable.
    - A visual indicator for the currently selected category.
    - **Future Considerations**:
        - Support for random category selection (e.g., a "Surprise Me!" button).
        - Display an image on each category card.
        - Allow multi-selection of categories (if game logic supports it).
    - A "Continue" or "Next" button to confirm the selection (optional, or selection can trigger immediate progression).
- **API Endpoint (Get Categories)**: `GET http://localhost:8080/api/v1/categories`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Role-based filtering**: The backend automatically checks the caller's role from the JWT.
        - **Regular users** receive only categories where `adminOnly = false`.
        - **Admins** receive all categories (including admin-only ones).
        - The frontend does not need to pass any extra parameter — filtering is fully server-side.
    - **Success (200 OK)**: Display the list of categories from the `data.categories` array in the response.
        ```json
        {
            "data": {
                "categories": [
                    {
                        "id": 1,
                        "categoryName": "Movies",
                        "isEnabled": true,
                        "adminOnly": false,
                        "totalWords": 50
                    },
                    {
                        "id": 2,
                        "categoryName": "Sports",
                        "isEnabled": true,
                        "adminOnly": false,
                        "totalWords": 35
                    }
                ]
            },
            "message": "Categories retrieved successfully",
            "status": "200 OK"
        }
        ```
    - **Error (404 NOT_FOUND - NO_CATEGORY_FOUND)**: Display "No categories available. Please check back later."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Category)**: `POST http://localhost:8080/api/v1/categories/{id}/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **No request body required** — the category ID is in the URL path.
    - **Success (200 OK)**: Display "Category selected successfully." The frontend must then immediately call `GET /api/v1/game/state` to determine the next screen (expected to be `GROUP_SELECTION`). The response contains no data.
    - **Error (404 NOT_FOUND - CATEGORY_NOT_EXISTS)**: Display "Selected category does not exist or is no longer available."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for category selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Create Category — Admin only)**: `POST http://localhost:8080/api/v1/categories`
    - **Request Headers**: `Authorization: Bearer <token>` (must be `ROLE_ADMIN`)
    - **Request Body**:
        ```json
        {
            "category_name": "Test",
            "admin_only": true
        }
        ```
        `admin_only` is optional and defaults to `false`. When `true`, the category is hidden from regular users in `GET /api/v1/categories`.
    - **Success (201 CREATED)**: Category created.
    - **Error (409 CONFLICT)**: Category name already exists.
    - **Error (400 BAD_REQUEST)**: `category_name` is missing.
    - **Error (403 FORBIDDEN)**: Caller is not an admin.
- **API Endpoint (Update Category — Admin only)**: `PUT http://localhost:8080/api/v1/categories/{id}`
    - **Request Headers**: `Authorization: Bearer <token>` (must be `ROLE_ADMIN`)
    - The category ID is in the **URL path** — `category_id` is no longer part of the body. All body fields are optional.
    - **Request Body**:
        ```json
        {
            "updated_name": "test 45",
            "admin_only": false,
            "is_enabled": true
        }
        ```
    - **Success (200 OK)**: Category updated.
    - **Error (404 NOT_FOUND)**: No category found for the given `category_id`.
    - **Error (409 CONFLICT)**: `updated_name` is already used by another category.
    - **Error (400 BAD_REQUEST)**: `id` path param missing or non-numeric.
    - **Error (403 FORBIDDEN)**: Caller is not an admin.
- **API Endpoint (Delete Category — Admin only)**: `DELETE http://localhost:8080/api/v1/categories/{id}`
    - **Request Headers**: `Authorization: Bearer <token>` (must be `ROLE_ADMIN`)
    - The category ID is in the **URL path**. Also deletes all words belonging to that category.
    - **Success (200 OK)**: Category and its words deleted.
    - **Error (404 NOT_FOUND)**: No category found for the given ID.
    - **Error (400 BAD_REQUEST)**: `categoryId` param is missing.
    - **Error (403 FORBIDDEN)**: Caller is not an admin.

#### 3.2.5. Group Selection Screen
- **Description**: Allows the user to manage and select a group of players for the game. This screen is displayed when the `gameStatus` from `GET /game-engine/game-state` is `GROUP_SELECTION`.
- **UI**:
    - A clear title: "Select or Create a Group".
    - A section displaying a list or grid of existing groups for the user. Each group item should prominently display the `groupName`.
    - Each group item should be clickable to view/edit group details.
    - A prominent "Add New Group" button.
    - **Group Details/Edit View (Modal or New Screen)**:
        - Displays `groupName` and a list of `playerNames`.
        - Allows editing `groupName` and `playerNames`.
        - "Save Changes" button.
        - "Delete Group" button (with confirmation).
    - **Add New Group Form (Modal or New Screen)**:
        - Input field for "Group Name".
        - Initial input field for "Player 1 Name".
        - A button "Add another player" which dynamically adds a new input field for a player name.
        - Validation:
            - Group name is required.
            - Player names are required.
            - Number of players must be within the configured min/max limits (fetched from `/config/get`).
        - "Create Group" button.
- **API Endpoint (Get All Groups)**: `GET http://localhost:8080/api/v1/groups`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display the list of groups. Frontend should also check `max_group_allowed` config to disable "Add New Group" button if limit is reached.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "No groups found. Start by creating one!"
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Get Particular Group)**: `GET http://localhost:8080/api/v1/groups/{id}`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display details of the requested group.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Group not found."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Create Group)**: `POST http://localhost:8080/api/v1/groups`
    - **Request Headers**: `Authorization: Bearer <token>` (Backend will extract `userId` from JWT)
    - **Request Body**:
        ```json
        {
            "group_name": "...",
            "players": [
                "Player1 Name",
                "Player2 Name"
            ]
        }
        ```
    - **Success (201 CREATED)**: Display "Group created successfully." Refresh the list of groups.
    - **Error (409 CONFLICT - GROUP_ALREADY_EXISTS)**: Display "A group with this name already exists."
    - **Error (400 BAD_REQUEST)**: Display "Group name and player names are required." or "Number of players out of bounds."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Update Group)**: `PUT http://localhost:8080/api/v1/groups/{id}` — ✅ **implemented** (no admin role; a user can only edit their **own** groups).
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: a full replace of the name and player list (both required).
        ```json
        { "group_name": "Updated Group Name", "players": ["Updated Player1", "Updated Player2"] }
        ```
    - **Success (200 OK)**: "Group updated successfully." Refresh the list of groups.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: "Group not found."
    - **Error (403 FORBIDDEN - ACCESS_DENIED)**: The group belongs to another user.
    - **Error (409 CONFLICT - GROUP_ALREADY_EXISTS)**: Another of your groups already uses that name.
    - **Error (400 BAD_REQUEST)**: `group_name` blank or `players` empty.
- **API Endpoint (Delete Group)**: `DELETE http://localhost:8080/api/v1/groups/{id}` — ✅ **implemented** (owner-only, no admin role).
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: "Group deleted successfully." Refresh the list of groups.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: "Group not found."
    - **Error (403 FORBIDDEN - ACCESS_DENIED)**: The group belongs to another user.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Group)**: `POST http://localhost:8080/api/v1/groups/{id}/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **No request body required** — the group ID is in the URL path.
    - **Success (200 OK)**: Display "Group selected successfully." The frontend must then immediately call `GET /api/v1/game/state` to determine the next screen (expected to be `GAME_OPTION_SELECTION`).
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Selected group does not exist."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for group selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.6. Configuration for Group Player Limits
- **Description**: The frontend needs to fetch configuration values for minimum and maximum players allowed in a group to enforce validation during group creation/update.
- **API Endpoint**: `GET http://localhost:8080/api/v1/configs`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "max_player_allowed_in_group"`, `key: "min_player_allowed_in_group"`, and `key: "max_group_allowed"`.
    - **Logic**:
        - On loading the group creation/edit form, fetch these configurations.
        - Use the `value` field from the response to set validation rules for the number of players.
        - Use the `value` field for `max_group_allowed` to limit the number of groups a user can create.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.7. Game Option Selection Screen
- **Description**: Allows the user to configure game-specific options, starting with the number of spies. This screen is displayed when the `gameStatus` from `GET /game-engine/game-state` is `GAME_OPTION_SELECTION`.
- **UI**:
    - A clear title: "Configure Game Options".
    - A section for "Number of Spies":
        - Displays the current selected number of spies.
        - "Increase" button to increment the number of spies.
        - "Decrease" button to decrement the number of spies.
        - The buttons should be disabled if the minimum or maximum limit (fetched from configuration) is reached.
        - A message should be displayed (e.g., a small pop-up or inline text) if a limit is reached upon attempting to change the value.
    - A "Start Game" or "Continue" button to proceed.
- **API Endpoint (Set Game Options)**: `POST http://localhost:8080/api/v1/game/options`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**:
        ```json
        {
            "number_of_spy": <selectedNumberOfSpies>
        }
        ```
    - **Success (200 OK)**: Display "Game options set successfully." The frontend must then immediately call `GET /api/v1/game/state` to determine the next screen (expected to be `WORD_AND_SPY_REVEAL`).
    - **Error (400 BAD_REQUEST - INVALID_NUMBER_OF_SPY)**: The backend rejects a spy count that is out of range. Valid range is **1 to 2**, and it must leave at least one innocent (so the effective max is `min(2, players − 1)`). The DTO also enforces `@Max(2)`. Clamp the stepper to this range.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for game option selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Configuration for Number of Spies)**: `GET http://localhost:8080/api/v1/configs`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "min_spy_allowed"` (1) and `key: "max_spy_allowed"` (now `2`, aligned with the game logic).
    - **Logic**:
        - On loading the game option selection screen, fetch these configurations.
        - Use the `value` fields to set the bounds for the number of spies.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.


### 5.5. Project Structure and Modularity

The frontend is built as a **platform that hosts games**, not as one game. The platform layer knows nothing about GueSpy; it knows only a contract. Adding a second game means writing a module and adding one line to the registry — no platform code changes.

```
src/
├── app/            # Shell: providers, router, layout, header, GameHost, 404
├── games/          # ★ One folder per game, plus the contract they implement
│   ├── types.js    #   the GameModule contract + defineGameModule()
│   ├── registry.js #   gameType -> module
│   └── guespy/     #   endpoints, session adapter, screens, theme.css
├── platform/       # Cross-game concerns: auth, config, sound, games hub
├── ui/             # Design-system primitives (Button, Card, Modal, …)
├── styles/         # Tokens, reset, shared keyframes, global base
├── hooks/          # Generic hooks (useCountdown)
├── lib/            # Non-React utilities: api client, errors, jwt, storage, sound
├── config/         # Build-time env (API base URL)
└── dev/            # Component gallery, mounted at /dev/ui in dev builds
```

#### The GameModule contract

```js
{
  id,          // must equal the `gameType` in the active_games config
  meta,        // name, tagline, emblem, player count, round length
  modes,       // PASS_AND_PLAY | ONLINE
  theme,       // value for [data-game], selects the module's theme.css
  useSession,  // the game's own state adapter (see below)
  screens,     // { serverStatus: ScreenComponent }
  entry,       // optional "resume or restart" prompt
}
```

**`useSession` is the seam that makes both play styles work.** A game supplies its own state adapter, so *how* state arrives is the game's business:

- **pass-and-play** polls REST and advances on user action (GueSpy today)
- **online multiplayer** would open a socket and push state

Both return the same `{ status, data, isLoading, error, refresh }`, so `GameHost` renders either identically and never learns which it got. That is why the host contains no game-specific code.

> ⚠️ Never put the whole session object in an effect's dependency array when the effect calls `refresh`. A refresh sets state, which changes the object identity, which re-runs the effect — an unbounded request loop, not a poll. Depend on `refresh`, which is a stable callback.

#### Theming

A game re-skins the entire app — components, focus rings, the ambient page backdrop — by overriding four `--accent-*` tokens:

```css
:root[data-game="guespy"] { --accent: …; --accent-bright: …; --accent-deep: …; --accent-2: …; }
```

The `:root` prefix is required, not stylistic: a bare `[data-game="…"]` has the same specificity as the `:root` block in `tokens.css`, so which one wins would depend on the order the bundler emits the files. Pick an accent clearly away from the danger (rose) and success (mint) hues, or primary and destructive buttons stop being distinguishable.

#### Styling

CSS Modules (`Component.module.css`) over a token layer. Components never hard-code a colour, radius, duration or shadow. Motion durations collapse under `prefers-reduced-motion`, so animations built on them self-disable in one place.

Screen entrances are **CSS** animations, not JS ones. A JS entrance renders at `opacity: 0` and relies on a frame loop to reveal the content, and this game is passed hand to hand — tabs get backgrounded mid-transition constantly, which starves `requestAnimationFrame` and can strand a screen blank.

#### Development

- Dev server **must** run on Vite's default port: backend CORS allows only `http://localhost:5173`.
- `/dev/ui` renders a live gallery of every UI primitive under an accent switcher.

#### 3.2.8. Word and Spy Reveal Screen (`WORD_AND_SPY_REVEAL`)
- **Description**: This screen guides players through revealing their roles (whether they are a spy or not) and their assigned word (for non-spies). It involves a "pass the device" mechanism to ensure each player sees their role privately. This screen is displayed when the `gameStatus` from `GET /game-engine/game-state` is `WORD_AND_SPY_REVEAL`.
- **UI**:
    - **Common Elements**: A prominent "Continue" button to proceed to the next player's turn or the next game phase.
    - **Screen Type: `PASS_DEVICE`**:
        - Displays a clear instruction like "Pass the device to [Player Name]" (from `data.displayText`).
        - Visually represent a player (e.g., an avatar or icon, potentially with a placeholder image).
        - The "Continue" button should be clearly visible.
    - **Screen Type: `ROLE_REVEAL`**:
        - Displays the player's role (e.g., "You are NOT a SPY" or "You are SPY") prominently (from `data.displayText`).
        - Displays the player's name (from `data.playerDetails.playerName`).
        - **For Non-Spies (`data.playerDetails.isSpy: false`)**:
            - Displays the `data.categoryName`.
            - Displays the `data.wordName`.
            - Displays the `data.roleDescriptionText` (if provided and relevant).
        - **For Spies (`data.playerDetails.isSpy: true`)**:
            - Displays the `data.categoryName`.
            - Displays the `data.roleDescriptionText` (if provided and relevant, e.g., a specific spy instruction).
            - The `data.wordName` **must not** be displayed.
        - The "Continue" button should be clearly visible.
- **API Endpoint**: `GET http://localhost:8080/api/v1/game/role-reveal`

  ⚠️ **This is a GET that mutates.** Every call advances the server's cursor (`PASS_DEVICE → ROLE_REVEAL → next player`) and persists it, and there is no way to read the current screen without consuming it. It must be called **exactly once per screen shown** — a duplicate call silently skips a player's role and quietly breaks the round. In React this means guarding the initial call with a ref rather than an empty dependency array, since StrictMode runs effects twice in development, and guarding the advance button against a double tap.

  A consequence worth knowing: reloading the browser mid-reveal advances one screen, because the mount has to call the endpoint to learn anything.
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        - **Response Type 1: `PASS_DEVICE`**: The payload is in the `data` object.
            ```json
            { // Example response for PASS_DEVICE screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "Pass the device to Sayam",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": null,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "PASS_DEVICE",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend should display the `data.displayText` and wait for user interaction (e.g., clicking "Continue").
        - **Response Type 2: `ROLE_REVEAL` (Non-Spy)**: The payload is in the `data` object.
            ```json
            { // Example response for ROLE_REVEAL (Non-Spy) screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "You are NOT a SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": false,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role (`data.displayText`), player name (`data.playerDetails.playerName`), category (`data.categoryName`), and word (`data.wordName`).
        - **Response Type 3: `ROLE_REVEAL` (Spy)**: The payload is in the `data` object.
            ```json
            { // Example response for ROLE_REVEAL (Spy) screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "You are SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": true,
                        "playerName": "Sunny",
                        "playerNumber": 2
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": null // the backend sends null for a spy
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role (`data.displayText`) and player name (`data.playerDetails.playerName`). For a spy, `data.wordName` is `null`.

            ✅ The secret word is now hidden server-side: `buildScreenData` sends `wordName: null` whenever the current player is a spy (both their pass-device and role-reveal screens), so the word never reaches a spy over the wire — not just in the rendered UI.
    - **Logic**:
        - The frontend will repeatedly call this API until `data.isLast` is `true`.
        - Once `data.isLast` is `true`, the frontend should then call `GET /api/v1/game/state` to transition to the next game phase (expected to be `DISCUSSION_TIME`).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for role reveal."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.9. Discussion Time Screen (`DISCUSSION_TIME`)
- **Description**: This screen is for the discussion phase of the game. A timer is displayed, and players discuss to find the spy. This screen is displayed when the `gameStatus` from `GET /game-engine/game-state` is `DISCUSSION_TIME`.
- **UI**:
    - A clear title: "Discussion Time".
    - A prominent countdown timer.
    - **The nominated starting player, stated plainly** — e.g. "Doll starts". Somebody has to speak first, and a table left to decide that for itself stalls. The same player is highlighted in the roster.
    - A list of players still in the round.
- **Logic**:
    - Everything the timer needs is on the `game-state` payload: `discussionStartTime` (epoch ms) and `discussionDuration` (**seconds**).
    - End time = `discussionStartTime + discussionDuration * 1000`.
    - ⚠️ **Do not read `discussion_duration` from `/config/get` for this.** The payload value is the one the engine itself used to compute the deadline, so the countdown and the server cannot disagree. Reading config instead let them drift indefinitely — `/config/get` serves the database while the engine serves its own cache (see "Known backend gaps"), which had the client counting down from ten minutes while the server ended discussion after twenty seconds.
    - **Do not poll during discussion.** Wait out the deadline, then call `game-state` **once**: the server flips the game to `VOTING` on the first call past it. A repeat call is only warranted if the device's clock is ahead of the server's and it still reports `DISCUSSION_TIME`; back off rather than spinning.
- **API Endpoint (`game-state`)**: `GET http://localhost:8080/api/v1/game/state`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK) with `DISCUSSION_TIME` status**:
        ```json
        {
            "data": {
                "gameStatus": "DISCUSSION_TIME",
                "discussionStartTime": 1786814625937,
                "discussionDuration": 600,
                "players": ["Doll", "Sayam", "Atif", "Sarah", "Ayan"],
                "startingPlayer": "Doll"
            },
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
    - ⚠️ **`startingPlayer` is re-randomised on every call.** `populateDiscussionTimeData` picks it with `getRandomNumber(...)` each time, so it is not stable across reads — two `game-state` calls during the same discussion will usually name different players. Not a problem while the screen fetches once, but it means the nomination cannot be treated as a persisted property of the round. Persisting it on the round would make it reliable.
    - **Error Handling**: Standard error handling applies as with other `game-state` calls.

#### 3.2.10. Voting Screen (`VOTING`)
- **Description**: This screen allows players to vote for who they believe is the spy. The screen updates for each player's turn until all votes are cast. This screen is displayed when the `gameStatus` from `GET /game-engine/game-state` is `VOTING`.
- **UI**:
    - A clear header, e.g., "Voting Time" (from `data.displayTextHeader`).
    - An instruction for the current player, e.g., "Sayam, choose one player who you think is the spy" (constructed from `data.currentPlayerName` and `data.displayText`).
    - A list or grid of player cards from `data.votingList`.
    - Each player card should be selectable and display the `playerName`.
    - A "Submit Vote" button, which becomes active after a player is selected.
- **Logic**:
    - When the `gameStatus` is `VOTING`, the frontend's first action is to call `GET /game-engine/voting` to get the data for the current voter.
    - The UI is rendered based on the response. The `votingList` excludes the `currentPlayerName` **and any players eliminated in previous rounds** (they cannot be voted for and do not vote).
    - When the user selects a player and clicks "Submit Vote", the frontend calls `POST /api/v1/game/votes` with `{ "player_id": N }` in the body.
    - After a successful vote, the frontend immediately calls `GET /api/v1/game/voting` again to get the data for the next player's turn.
    - This cycle continues. The `data.isLast` flag in the `GET /game-engine/voting` response indicates if the current vote is the final one.
    - If `isLast` was `true` for the current turn, after that player votes the round is resolved. The frontend must call `GET /game-engine/game-state` to find the next state, which will be one of `REVOTE`, `SPY_GUESS`, `ROUND_END`, or `SCORING` — see **3.2.11 Round Outcome & Multi-Round Flow**.
- **API Endpoint (Get Voting Screen Data)**: `GET http://localhost:8080/api/v1/game/voting`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        ```json
        {
            "data": {
                "currentPlayerName": "Sayam",
                "displayText": "Choose one player who you think is the spy",
                "displayTextHeader": "Voting Time",
                "isLast": false,
                "votingList": [
                    { "playerId": 2, "playerName": "Sunny" },
                    { "playerId": 3, "playerName": "Sarah" }
                ]
            },
            "message": "Voting Screen fetched successfully",
            "status": "200 OK"
        }
        ```
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for voting."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Cast Vote)**: `POST http://localhost:8080/api/v1/game/votes`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "player_id": <selected_player_id> }` — the player number (1-based) from `votingList[].playerId`.
    - **Success (200 OK)**:
        ```json
        {
            "data": null,
            "message": "Vote cast successfully",
            "status": "200 OK"
        }
        ```
        *   After this response, the frontend proceeds with the logic described above (either call `/game-engine/voting` again or `/game-engine/game-state`).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for voting."
    - **Error (400 BAD_REQUEST - INVALID_VOTE)**: Display "You cannot vote for this player." or "It's not your turn to vote."
    - **Error (404 NOT_FOUND - PLAYER_NOT_FOUND)**: Display "The player you voted for does not exist."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.



#### 3.2.11 Round Outcome & Multi-Round Flow

Once every **active** player has cast a vote (see 3.2.10), the backend tallies the votes and moves the game to one of several states. The frontend detects the new state by calling `GET /game-engine/game-state` after the final vote of the round.

- The most-voted player is the "accused".
- **Tie** (two or more players share the highest vote count) → `gameStatus` = `REVOTE`. The frontend re-runs the voting flow for the same active players (call `GET /game-engine/voting` again and continue as in 3.2.10). Voting and voting-submission endpoints accept both `VOTING` and `REVOTE`.
- **Accused is an innocent** → they are eliminated. If enough players remain the game continues to another round (`ROUND_END`, see 3.2.13); if too few remain the spies win (`SCORING`, see 3.2.14).
- **Accused is a spy** → `gameStatus` = `SPY_GUESS` (see 3.2.12): the caught spy decides whether to guess the word.

Rules the frontend should be aware of:
- **Eliminated players are excluded from every later round** — they neither vote nor appear in any `votingList`.
- The game supports **1 or 2 spies** (chosen on the Game Option screen).
- A round "continues" only while the number of remaining active players is above a server-configured minimum. When it drops to/below that minimum with a spy still hidden, the spies win.

#### 3.2.12 Spy Guess Screen (`SPY_GUESS`)
- **Description**: Shown when a spy has been voted out. The caught spy chooses to either **guess the secret word** (the spy team wins if correct) or **decline**. This screen is displayed when `gameStatus` is `SPY_GUESS`.
- **UI**:
    - Display the caught spy's name (`data.caughtSpyName`) and the `data.categoryName`.
    - A text input for the word guess and a "Guess" button.
    - A "Decline" button.
    - **The secret word must NOT be shown on this screen.**
- **API Endpoint (`game-state`)**: `GET http://localhost:8080/api/v1/game/state`
    - **Success (200 OK) with `SPY_GUESS`**:
        ```json
        {
            "data": { "gameStatus": "SPY_GUESS", "caughtSpyName": "Sunny", "categoryName": "Movies", "roundNumber": 2 },
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **API Endpoint (Guess the word)**: `POST http://localhost:8080/api/v1/game/spy/guess`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "word": "Inception" }`
    - **Success (200 OK)**: The game moves to `SCORING`. A **correct** guess means the spies win; a **wrong** guess means the innocents win. After the response, call `GET /api/v1/game/state` (expected `SCORING`).
    - **Error (400 BAD_REQUEST)**: Word is blank/invalid, or the game is not in a state that allows guessing.
- **API Endpoint (Decline to guess)**: `POST http://localhost:8080/api/v1/game/spy/decline`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: The caught spy is eliminated. If they were the **last** spy, the innocents win → `SCORING`. Otherwise the round continues → `ROUND_END` (or `SCORING` if too few players remain). After the response, call `GET /api/v1/game/state`.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Only valid at `SPY_GUESS`.
- **Voluntary guess**: `POST /api/v1/game/spy/guess` is also accepted during `DISCUSSION_TIME`, `VOTING`, and `REVOTE`, allowing a spy to proactively guess the word at any point in a round (same win/lose outcome).

#### 3.2.13 Round End Screen (`ROUND_END`)
- **Description**: An interstitial shown after an innocent is voted out (or a caught spy declines) and the game continues. It announces who was eliminated, then proceeds to the next round. Displayed when `gameStatus` is `ROUND_END`.
- **UI**:
    - Display "<`data.eliminatedPlayerName`> was voted out" and (optionally) the round number.
    - A prominent "Continue" button.
- **API Endpoint (`game-state`)**: `GET http://localhost:8080/api/v1/game/state`
    - **Success (200 OK) with `ROUND_END`**:
        ```json
        {
            "data": { "gameStatus": "ROUND_END", "eliminatedPlayerName": "Aarib", "roundNumber": 2 },
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **API Endpoint (Start next round)**: `POST http://localhost:8080/api/v1/game/rounds/next`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Starts the next round — the game returns to `DISCUSSION_TIME` (a fresh discussion timer starts), then transitions to `VOTING` exactly as in 3.2.9–3.2.10. After the response, call `GET /api/v1/game/state`.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Only valid at `ROUND_END`.

#### 3.2.14 Scoring / Result Screen (`SCORING`)
- **Description**: The final screen, shown when the game is over. It reveals the outcome, the spies, the word, and every player's score. Displayed when `gameStatus` is `SCORING`.
- **UI**:
    - Prominently show who won (`data.winner`: `SPY` or `INNOCENT`).
    - Reveal the `data.spies` (names) and the secret `data.word`.
    - Render `data.scores` as a leaderboard (e.g., sorted by `score` descending).
    - A "New Game" button.
- **API Endpoint (`game-state`)**: `GET http://localhost:8080/api/v1/game/state`
    - **Success (200 OK) with `SCORING`**:
        ```json
        {
            "data": {
                "gameStatus": "SCORING",
                "winner": "SPY",
                "word": "Inception",
                "spies": ["Sunny"],
                "roundNumber": 3,
                "scores": [
                    { "playerNumber": 1, "playerName": "Sayam", "score": -2 },
                    { "playerNumber": 2, "playerName": "Sunny", "score": 6 },
                    { "playerNumber": 3, "playerName": "Sarah", "score": -2 }
                ]
            },
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **New Game**: `POST http://localhost:8080/api/v1/game/reset`, then `GET /api/v1/game/state` (expected `CATEGORY_SELECTION`).
- **Scoring rules (context for the UI)**: for every round the spies survive, each spy gains points and each innocent loses points; the winning side receives a bonus at the end. All point values are configured server-side (see 3.2.15), so the frontend should render whatever `scores` are returned rather than assuming fixed numbers.

#### 3.2.15 Scoring Configuration (server-side)
- The tunable scoring rules live in a single `app_config` row, `key: "scoring_config"`, whose value is a JSON object:
    ```json
    {
        "minPlayersToContinue": 3,
        "spyPointsPerRound": 1,
        "innocentPointsPerRound": 1,
        "spyWinBonus": 2,
        "innocentWinBonus": 2
    }
    ```
- These are applied by the backend; the frontend does not need to read them, but they explain the numbers shown on the Scoring screen.

#### 3.2.16 Game State Navigation (Back / Forward)
- **Description**: A single endpoint to move the user between game states outside the normal forward flow — a **"Back"** button on the setup screens, and a **"Skip"** on the discussion screen. It updates the server-side state and returns the resulting screen.
- **API Endpoint**: `POST http://localhost:8080/api/v1/game/state`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "action": "back" }` or `{ "action": "forward" }` (case-insensitive).
    - **Success (200 OK)**: Returns the resulting game state — the **same shape as `GET /api/v1/game/state`** (`gameStatus` inside `data`, plus any state-specific fields). The change is persisted.
    - **`"back"`** — step one state back. Valid only when the current `gameStatus` is one of `CATEGORY_SELECTION`, `GROUP_SELECTION`, `GAME_OPTION_SELECTION`, `WORD_AND_SPY_REVEAL`, `DISCUSSION_TIME`. Transitions (each clears the selections owned by the state being left, so the user re-does them):
        | From | To | Cleared |
        |---|---|---|
        | `CATEGORY_SELECTION` | `NOT_STARTED` | selected category |
        | `GROUP_SELECTION` | `CATEGORY_SELECTION` | selected category |
        | `GAME_OPTION_SELECTION` | `GROUP_SELECTION` | selected group |
        | `WORD_AND_SPY_REVEAL` | `GAME_OPTION_SELECTION` | number of spies, assigned word/spies, reveal progress |
        | `DISCUSSION_TIME` | `WORD_AND_SPY_REVEAL` | reveal progress + discussion timer (word/spies kept; reveal restarts) |
    - **`"forward"`** — only valid at `DISCUSSION_TIME`: skips the remaining discussion time and moves straight to `VOTING`.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: The action isn't allowed from the current state (e.g. `back` from `VOTING`, or `forward` outside `DISCUSSION_TIME`).
    - **Error (400 BAD_REQUEST)**: `action` missing or not `back`/`forward`.
- **Frontend behaviour** (`src/games/guespy/backPolicy.js` holds the rules; `BackControl` renders them):
    - **Back is not offered at `CATEGORY_SELECTION`.** The transition is legal, but it lands on `NOT_STARTED`, and this UI maps both statuses to the same category screen — the button would appear to do nothing. Leaving the game is what the header's "All games" link is for.
    - **The two destructive steps confirm first**; the two selection steps do not. Backing out of `WORD_AND_SPY_REVEAL` re-deals the word and the spies, and backing out of `DISCUSSION_TIME` restarts the whole pass round the table — a mis-tap on a device being handed between people costs the round. Undoing a category or group pick costs nothing, and gating it behind a dialog would only add a tap.
    - **The response is adopted directly**, not followed by a `GET`. The body is already the resulting state, so re-reading it would only add a round trip and a flicker.
    - ⚠️ **Back from `DISCUSSION_TIME` is only sound in round one** — see "Known backend gaps".

### 3.3 Admin Area (`/admin`)

- **Description**: A role-gated area for managing the word bank and the server settings — the things that decide what a game *is*, which until now could only be changed with curl.
- **Access**: `user.role === "ADMIN"`, read from the JWT (`lib/jwt.js`). The claim is the **bare enum name** — `"ADMIN"` / `"USER"` — because `JwtUtil` writes `user.getRole()` and it is `JwtFilter` that prefixes `ROLE_` when building authorities. Matching on `"ROLE_ADMIN"` in the frontend would silently never fire.
- ⚠️ **The guard is cosmetic.** It decides what to render and nothing more; every endpoint below is enforced server-side with `@PreAuthorize("hasRole('ADMIN')")` off the same token. Someone who edits the stored claim gets the page and then a wall of 403s.

#### 3.3.1 Structure

The platform owns the shell; each game owns its own content sections. A game declares them on its module (`games/types.js`):

```js
admin: { sections: [{ id, label, Component }] }
```

`platform/admin/adminSections.js` collects them from `listGameModules()` and renders them beside the platform's own. Adding a second game's admin screens therefore touches no platform code — the same promise `screens` and `entry` already make. Configuration stays platform-side: it belongs to the install, not to any one game.

#### 3.3.2 Word bank (GueSpy)

Categories and their words, master–detail in one section. Words are only reachable through a category (`/api/v1/categories/{id}/words`), so splitting them into two tabs would misrepresent the API.

| Action | Endpoint | Notes |
|---|---|---|
| List categories | `GET /api/v1/categories` | Role-filtered server-side. 404 when empty → `[]` |
| Create | `POST /api/v1/categories` | `{ category_name, admin_only }`. 409 on a duplicate name |
| Rename / flag | `PUT /api/v1/categories/{id}` | `{ updated_name?, admin_only?, is_enabled? }` — each applied only when present |
| Delete | `DELETE /api/v1/categories/{id}` | **Cascades to every word in it.** No undo |
| List words | `GET /api/v1/categories/{id}/words` | `{ words, totalWords, categoryName }`. 404 when empty → `[]` |
| Add words | `POST /api/v1/words` | `{ category_id, words: [...] }` → `{ added, skipped }` |
| Rename word | `PUT /api/v1/words/{id}` | `{ word_name }`. 409 if already in the category |
| Delete word | `DELETE /api/v1/words/{id}` | |

- **Bulk add is partial-success by design.** Blank entries are ignored and words already in the category are skipped rather than rejected, so a batch containing duplicates still lands. The UI reports both halves ("Added 7. Skipped 3 already in this category.") instead of failing the whole paste.
- **Deleting a category asks for its name to be typed**, unlike every other confirmation in the app, which is a two-button dialog. It erases the category *and all its words* irreversibly, and the rows look alike enough to click the wrong one.
- ⚠️ **`totalWords` is a stored counter, not a count.** It is incremented on add and decremented on delete, so it can drift from the list it claims to describe. The detail pane shows `words.length`; the category list shows `totalWords`, since that is all the list endpoint carries.

#### 3.3.3 Settings

Not yet built — see the second admin branch. `GET/POST/PUT /api/v1/configs` and `GET /api/v1/configs/refresh` are the surface.

## 4. Non-Functional Requirements

### 4.1. Performance
- The application should be highly responsive, with fast loading times and smooth UI transitions.
- All API calls should be asynchronous to prevent UI blocking.

### 4.2. Security
- **JWT Handling**: The JWT token received upon login/registration must be securely stored client-side (e.g., `localStorage` for convenience, but `HttpOnly` cookies are more secure for production environments). The frontend will be responsible for extracting the `userId` from the JWT token.
- **Authorization Header**: All authenticated API requests must include the `Authorization: Bearer <token>` header. This is the **only** header the backend needs for identity — it extracts the `userId` and `role` from the token itself. (There is no `X-User-Id` header; do not send one.)
- **Role-Based Access Control**: The frontend may extract the user's `role` from the JWT to conditionally render UI elements or restrict access to certain routes (e.g., for ADMIN screens). The backend independently enforces roles on admin endpoints (403 on violation).

### 4.3. Error Handling
- **Consistent response envelope**: **Every** backend response — success or error — is a JSON object with `status` (e.g. `"400 BAD_REQUEST"`), `message` (a human-readable string), and, on success, `data`.

- ⚠️ **There is no machine-readable error code on the wire.** Names used throughout this document — `NO_CATEGORY_FOUND`, `INVALID_GAME_STATUS`, `GROUP_ALREADY_EXISTS` — are server-side `ResponseEnum` constants that are **never serialised**. `GenericResponse` carries only `status`, `message` and `data`.

  So a screen can only branch on **HTTP status plus the endpoint it called**, and must treat `message` as display text rather than something to match on. That is sufficient in practice, because each screen calls one endpoint at a time and the statuses are unambiguous within that context — but it is fragile, since re-wording a message must not be allowed to change behaviour. Adding a `code` field to the envelope would remove the coupling; `src/lib/apiError.js` is the single place that would need to learn about it.

- **Specific Error Messages**: For known conditions, display user-friendly messages as detailed in the functional requirements, keyed on the status codes below:
    - `400 BAD_REQUEST` — validation failure (missing/invalid fields; the `message` names the failing field), malformed JSON body, or an action attempted in the wrong game state (`INVALID_GAME_STATUS`).
    - `401 UNAUTHORIZED` — missing/invalid/expired token (also returned as the envelope). Redirect to login.
    - `403 FORBIDDEN` — authenticated but not allowed (e.g. a non-admin calling an admin endpoint).
    - `404 NOT_FOUND` — entity does not exist.
    - `409 CONFLICT` — a duplicate (e.g. user/category/group already exists) or a concurrent-modification conflict (two overlapping writes to the same game — safe to retry the last action).
- **Generic 500 Error**: Any `500 Internal Server Error` should trigger a small, non-blocking toast with a red background displaying "Internal Server Error". Dismissible or auto-hide after a few seconds.
- **Network Errors**: Handle network connectivity issues gracefully (e.g., "No internet connection").

## 5. Technical Considerations

### 5.1. Frontend Framework/Library
- A modern, component-based JavaScript framework (e.g., React, Vue.js, Angular) is recommended for building the UI. For this project, **React** is the chosen framework.

### 5.2. State Management
- A robust state management solution (e.g., Redux, Vuex, Zustand, React Context API with `useReducer`) should be used to manage application-wide state, including authentication status, user data, and game progress.

### 5.3. API Integration
- Use a library like Axios for making HTTP requests.
- Implement a request interceptor to automatically attach the `Authorization: Bearer <token>` header to authenticated requests.
- Implement response interceptors to handle global error conditions (e.g., 401 unauthorized, 500 internal server error) and potentially refresh tokens if applicable.

### 5.4. Routing
- Implement client-side routing to manage navigation between different application views (e.g., `/login`, `/register`, `/game`, `/game/category-selection`).

## 6. Future Considerations (ADMIN Screen)
- The frontend architecture should be designed to easily accommodate an ADMIN screen in the future. This implies:
    - **Role-Based Access Control (RBAC)**: Implement logic to conditionally render UI elements or restrict access to certain routes based on the user's role (e.g., 'USER' vs. 'ADMIN'), which can be extracted from the JWT token.
    - **Modular Design**: Keep admin-specific components and logic separate from user-facing components.

## 7. Backend API Endpoints (Summary for Frontend Reference)

### Authentication
- `POST http://localhost:8080/api/v1/auth/register`: User registration.
- `POST http://localhost:8080/api/v1/auth/login`: User login.
- Logout: client-side only (discard the token) — no backend endpoint.

### Game Engine
- `POST http://localhost:8080/api/v1/game/reset`: Resets the current game for the user.
- `GET http://localhost:8080/api/v1/game/state`: Retrieves the current game screen/status for the user.
- `POST http://localhost:8080/api/v1/game/state`: Navigate game states — body `{ "action": "back" | "forward" }`.
- `GET http://localhost:8080/api/v1/game/role-reveal`: Advances the role reveal cursor (call once per screen until `data.isLast` is true).
- `POST http://localhost:8080/api/v1/game/options`: Sets game options — body `{ "number_of_spy": 1|2 }`.
- `GET http://localhost:8080/api/v1/game/voting`: Retrieves the current voter's voting screen (valid at `VOTING`/`REVOTE`).
- `POST http://localhost:8080/api/v1/game/votes`: Casts a vote — body `{ "player_id": N }`.
- `POST http://localhost:8080/api/v1/game/rounds/next`: Advances from `ROUND_END` into the next round.
- `POST http://localhost:8080/api/v1/game/spy/guess`: A spy guesses the word — body `{ "word": "..." }`.
- `POST http://localhost:8080/api/v1/game/spy/decline`: A caught spy declines to guess.

### Group Management
- `GET http://localhost:8080/api/v1/groups`: Retrieves all of the user's groups.
- `GET http://localhost:8080/api/v1/groups/{id}`: Retrieves a specific group.
- `POST http://localhost:8080/api/v1/groups`: Creates a new group.
- `PUT http://localhost:8080/api/v1/groups/{id}`: Updates one of the user's own groups (owner-only, no admin role).
- `DELETE http://localhost:8080/api/v1/groups/{id}`: Deletes one of the user's own groups (owner-only, no admin role).
- `POST http://localhost:8080/api/v1/groups/{id}/select`: Selects a group for the current game (ID in path, no body).

### Category Management
- `GET http://localhost:8080/api/v1/categories`: Retrieves categories — role-filtered automatically (admin-only categories hidden from regular users).
- `POST http://localhost:8080/api/v1/categories/{id}/select`: Selects a category for the current game (ID in path, no body).
- `GET http://localhost:8080/api/v1/categories/{id}/words`: Lists all words for a category.
- ✅ (admin) `POST http://localhost:8080/api/v1/categories` — body: `{ "category_name": "...", "admin_only": true|false }`. `admin_only` defaults to `false` if omitted.
- ✅ (admin) `PUT http://localhost:8080/api/v1/categories/{id}` — body: `{ "updated_name": "...", "admin_only": true|false, "is_enabled": true|false }`. All body fields optional.
- ✅ (admin) `DELETE http://localhost:8080/api/v1/categories/{id}` — deletes the category and all its words.

### Word Management (admin)
- `POST http://localhost:8080/api/v1/words`: Adds one or more words to a category — body `{ "category_id": n, "words": ["...", "..."] }`; returns `{ added, skipped }`.
- `PUT http://localhost:8080/api/v1/words/{id}`: Renames a word — body `{ "word_name": "..." }`.
- `DELETE http://localhost:8080/api/v1/words/{id}`: Deletes a word.

### Configuration
- `GET http://localhost:8080/api/v1/configs`: Retrieves application configurations (e.g., player limits, spy limits, `scoring_config`, and `active_games` for the game-selection screen).
- ✅ (admin) `POST http://localhost:8080/api/v1/configs`: Creates a new config entry.
- ✅ (admin) `PUT http://localhost:8080/api/v1/configs`: Updates a config entry.
- ✅ (admin) `GET http://localhost:8080/api/v1/configs/refresh`: Refreshes the in-memory config cache.

---

## Known backend gaps

Found while building and verifying the frontend against a running backend. None of them block the current scope — the frontend works around each — but the workarounds are client-side and several of these are only truly fixable on the server.

### Correctness

1. ✅ **Fixed.** `number_of_spy` is now bounded: `GameOptionRequest` has `@Max(2)`, and `gameOptionEngine` rejects a count that wouldn't leave an innocent (`> players − 1`) with `400 INVALID_NUMBER_OF_SPY` — before `getRandomSpy` runs. The old unbounded value could spin `getRandomSpy` forever; that path is now unreachable from the endpoint.

2. ✅ **Fixed.** `max_spy_allowed` is now `2` (Flyway `V6`), matching the game logic.

3. ✅ **Fixed.** `AuthService.userRegister` now saves the user before generating the token, so the token carries the `userId` claim.

4. **`/config/get` and the game engine read different sources.** `getAllConfigs()` queries the database (`findAll()`); the engine reads an in-memory cache refreshed only on startup, on `createNewConfig`/`updateConfig`, or via `/config/refresh`. **A row edited directly in the database changes what the API reports but not what the game uses**, indefinitely. Observed live: the client counted down from ten minutes while the server ended discussion after twenty seconds.
   *Fix:* serve `getAllConfigs()` from the same cache. Note it also uses `findAll()` where the cache uses `findActiveConfigs()`, so `/config/get` reports **inactive** rows as live.

   *Partly addressed:* `discussionDuration` is now sent on the `DISCUSSION_TIME` payload, so the timer no longer depends on config at all. The underlying divergence still affects every other key the frontend reads.

### Information leaks

5. ✅ **Fixed.** `buildScreenData` now sends `wordName: null` whenever the current player is a spy (their pass-device and role-reveal screens), so the secret word never reaches a spy over the wire.

### API shape

6. **`role-reveal` is a GET that mutates** (see 3.2.8). A non-mutating "read current screen" endpoint would remove a whole class of client-side fragility, including the reload-skips-a-screen behaviour.

7. **The envelope carries no error code** (see 4.3). Adding `code` would let clients branch on something stable instead of HTTP status plus context.

### Still missing

8. ✅ **Fixed.** Group editing and deletion now exist: `PUT /group/update?groupId={id}` and `DELETE /group/delete?groupId={id}` — owner-scoped, no admin role. See 3.2.5.

9. **`max_group_allowed`** is read by the frontend but not seeded; it falls back to a default.

10. **`roleDescriptionText`** is always `null`. Populating it would allow richer spy instructions or a "spy word" variant. Separately, `categoryName` *is* sent to spies — correct for the current rules, but worth revisiting if a variant should hide it.

### Configuration keys the frontend reads

`min_player_allowed_in_group`, `max_player_allowed_in_group`, `max_group_allowed`, `min_spy_allowed`, `max_spy_allowed`, `scoring_config` (JSON, see 3.2.15), `active_games` (JSON, see 3.2.0).

`discussion_duration` is **no longer read by the frontend**. It now arrives on the `DISCUSSION_TIME` payload as `discussionDuration`, which is the value the engine actually used — see 3.2.9.

11. ✅ **Fixed.** `INVALID_DATA` (returned when `action` is not `back`/`forward` on `POST /game-engine/game-state`) was incorrectly mapped to `200 OK`. It now correctly returns `400 BAD_REQUEST`.

12. **`moveBack` from `DISCUSSION_TIME` assumes round one.** It clears `roundNumber` (the reveal then sets it back to `1`) but leaves `votingData.votes` and the eliminated players untouched. Going back during round three therefore restarts the round counter *and* walks eliminated players through a reveal they are no longer part of. Not a crash — the voting list still excludes them — but the round number is wrong from then on.
    *Fix:* either clear the round's voting/elimination state alongside it, or reject `back` from `DISCUSSION_TIME` when `roundNumber > 1`.

13. **`roundNumber` is missing from the `DISCUSSION_TIME` payload.** `populateDiscussionTimeData` sends `discussionStartTime`, `discussionDuration`, `players` and `startingPlayer` — but not the round number, which `ROUND_END`, `SPY_GUESS` and `SCORING` all include. The frontend therefore cannot tell round one from round three while the discussion is on screen, which is exactly the check gap 12 needs. The guard is already written in `backPolicy.js`, keyed on `data.roundNumber`, and is inert until the field arrives.
    *Fix:* one line — `data.setRoundNumber(gameData.getRoundNumber())` in `populateDiscussionTimeData`. Also useful on its own: the discussion screen could then show "Round 3".

14. **An admin cannot see a disabled category, so cannot re-enable one.** `CategoryRepository.findAllActiveCategoryForUser` filters `c.isEnabled = true` for *everyone* — the `isAdmin` flag only widens the `adminOnly` half of the condition. Disabling a category from the admin page therefore removes it from the admin's own list, permanently, and there is no other way back. **This blocks the enable/disable toggle**, which currently warns when the category vanishes rather than pretending it worked.
    *Fix:* one line — `WHERE (:isAdmin = true OR (c.isEnabled = true AND c.adminOnly = false))`.

15. **`PUT /api/v1/words/{id}` rejects a body that omits `word_id`.** `WordUpdateRequest.wordId` is `@NotNull`, but `WordController.update` takes the id from `@PathVariable` and never reads the field — so `{"word_name": "..."}` fails validation with a 400 before the service runs. **This blocks word renaming.**
    *Fix:* drop `wordId` from the DTO, or its `@NotNull`; the path already carries it.

16. **`WordService.deleteWord` sets `totalWords` to `1` when it was `null`**, where `0` is meant: `currentTotal != null ? currentTotal - 1 : 1`. Minor, but it is one of the ways the counter drifts from the real word count.
