# Flow Management System Example Scenario

## Admin Setup Process

### 1. Create Sections

Admin creates lesson sections:

- **Warmup** - Opening activities
- **Brainstorm** - Idea generation activities
- **Vocab Builder** - Vocabulary learning activities
- **Grammar Builder** - Grammar practice activities
- **Conversation Builder** - Speaking practice activities
- **Summary** - Closing activities

### 2. Create Templates

**Template A: "Show Vocabulary"**

- Setup Node: [Image Asset Block]
- Lecture Node: [Asset Applied Block] → [Teacher Video Block]

**Template B: "Ask Multiple Choice"**

- Lecture Node: [Collect User Data Block]
- Condition Node: [Condition Branch Block] (correct/incorrect)

**Template C: "Play Introduction"**

- Setup Node: [Video Asset Block]
- Lecture Node: [Asset Applied Block]

### 3. Create Groups with Positioning

**Group: "Content Display"**

- Position 1: Template C "Play Introduction"
- Position 2: Template A "Show Vocabulary"

**Group: "User Interaction"**

- Position 1: Template A "Show Vocabulary"
- Position 2: Template B "Ask Multiple Choice"

### 4. Assign Groups to Sections

- **Vocab Builder** section gets: "Content Display" + "User Interaction"

### 5. Create Blueprint

**Blueprint: "Standard Vocab Lesson"** (for Vocab Builder section)

```
├── Group: "Content Display"
│   ├── Template C "Play Introduction"
│   └── Template A "Show Vocabulary"
├── Group: "User Interaction"
│   ├── Template B "Ask Multiple Choice"
│   ├── Template B "Ask Multiple Choice" (DUPLICATE)
│   └── Template A "Show Vocabulary" (REUSED)
```

## Collaborator Usage

### 1. Create Script

**Script: "Animals Vocabulary"** with Vocab Builder section

### 2. Select Blueprint → Creates Setup (Snapshot)

**Script:**

```json
{
    "script_id": "animals_vocabulary",
    "name": "Animals Vocabulary Lesson",
    "sections": [
        { "section_id": "sect_001", "name": "Vocab Builder" }
        // Array index 0 = position
    ]
}
```

**Setup:**

```json
{
    "setup_id": "animals_vocab_setup",
    "script_id": "animals_vocabulary",
    "section_id": "sect_001",
    "section_name": "Vocab Builder", // Snapshotted name
    "original_blueprint_id": "standard_vocab_lesson",
    "created_at": "2024-01-15T10:30:00Z",

    "groups": [
        {
            "group_id": "grp_001",
            "group_name": "Content Display", // Snapshotted name
            "original_group_id": "content_display_group",
            "flow_ids": ["intro_video", "show_animals"]
            // Array index = position (intro_video at 0, show_animals at 1)
        },
        {
            "group_id": "grp_002",
            "group_name": "User Interaction",
            "original_group_id": "user_interaction_group",
            "flow_ids": ["quiz_1", "quiz_2", "review_vocab"]
            // Array index = position
        }
    ]
}
```

**Flows:**

```json
{
    "flow_id": "intro_video",
    "setup_id": "animals_vocab_setup",
    "group_id": "grp_001",
    "template_id": "template_C",
    "template_name": "Play Introduction", // Snapshotted
    "blocks": {} // Will be filled with data
}
```

### 3. Fill in Data

**Flow: "intro_video"**

```json
{
    "flow_id": "intro_video",
    "setup_id": "animals_vocab_setup",
    "group_id": "grp_001",
    "template_id": "template_C",
    "blocks": {
        "video_asset": { "url": "animals_intro.mp4" },
        "asset_applied": { "autoplay": true }
    }
}
```

**Flow: "show_animals"**

```json
{
    "flow_id": "show_animals",
    "setup_id": "animals_vocab_setup",
    "group_id": "grp_001",
    "template_id": "template_A",
    "blocks": {
        "image_asset": { "urls": ["cat.jpg", "dog.jpg", "bird.jpg"] },
        "teacher_video": { "script": "Here are some animals..." }
    }
}
```

**Flow: "quiz_1"**

```json
{
    "flow_id": "quiz_1",
    "setup_id": "animals_vocab_setup",
    "group_id": "grp_002",
    "template_id": "template_B",
    "blocks": {
        "collect_user_data": { "question": "What sound does a cat make?" },
        "condition_branch": { "correct": "meow", "incorrect": "Try again" }
    }
}
```

### 4. Modify Structure (Snapshot Independence)

Collaborator removes "quiz_2" and reorders groups:

**Modified Script (added Grammar Builder section):**

```json
{
    "sections": [
        { "section_id": "sect_001", "name": "Vocab Builder" }, // index 0
        { "section_id": "sect_002", "name": "Grammar Builder" } // index 1 - ADDED
    ]
}
```

**Modified Setup (reordered groups, removed flow):**

```json
{
    "setup_id": "animals_vocab_setup",
    "groups": [
        {
            "group_id": "grp_002",
            "group_name": "User Interaction", // MOVED to index 0
            "flow_ids": ["quiz_1", "review_vocab"] // quiz_2 REMOVED
        },
        {
            "group_id": "grp_001",
            "group_name": "Content Display", // MOVED to index 1
            "flow_ids": ["show_animals", "intro_video"] // REORDERED flows
        }
    ]
}
```

**Updated Flow (reflects new group membership):**

```json
{
    "flow_id": "quiz_1",
    "group_id": "grp_002", // Still references same group
    "template_id": "template_B"
    // Flow data unchanged, but now appears first due to group reordering
}
```

**Key Snapshot Behaviors:**

- Array index determines display order (no position field needed)
- Setup can be modified without affecting original blueprint
- Flows maintain group relationships via group_id
- Original blueprint and other setups remain unchanged

## Key Concepts Demonstrated

1. **Template Positioning**: Groups define default order, blueprints customize it
2. **Node Structure**: Each template contains specific node types with blocks
3. **Structural Config**: Blueprints reference templates with duplications/omissions
4. **Snapshot Independence**: Setups can be modified without affecting original blueprint
5. **Template Reusability**: Same template used multiple times with different data
