# Interactive Visualisation of Semantic Word Clusters

An interactive web-based system for exploring and organising semantic relationships between words. The project was developed as part of my Bachelor's thesis in Computer Science, with a focus on Human-Computer Interaction (HCI), user-centred design, and Natural Language Processing (NLP).

The system was designed to support secondary school students in collaboratively exploring semantic relationships and developing a shared understanding of concepts.

## Demo

A video demonstration of the system is available here:

[▶️ Watch the video demo](video/tutorial.mp4)

## Project Overview

The system takes a context and a set of keywords as input and automatically generates a two-dimensional semantic representation.

The semantic relationships are computed using:

- **Sentence-BERT** to generate contextual word embeddings
- **UMAP** to project the high-dimensional embeddings into a two-dimensional space
- **D3.js** to create the interactive visualisation

The resulting semantic map is presented through an interactive web interface. Users can then:

- Explore the automatically generated semantic layout
- Move and reorganise words through drag-and-drop
- Create visual clusters around related words
- Iteratively refine their representation
- Analyse the resulting organisation

Rather than treating the automatically generated layout as a final answer, the system uses it as a starting point for users to explore and construct their own interpretation.

## User-Centred Design

A key part of the project was the application of a user-centred HCI approach.

The system was evaluated through collaborative activities with secondary school students. Their interactions, discussions, and ways of organising concepts were observed to understand their needs and emerging mental models.

The findings were then translated into functional and usability requirements that guided the further development of the interface.

This resulted in an iterative process:

**User Study → Observations → Findings & Mental Models → Requirements → Design → Implementation**

The project therefore combines technical development with an HCI perspective, focusing not only on how the system works but also on how users interact with and make sense of it.

## Architecture

The project follows a client-server architecture.

### Frontend

The frontend is responsible for:

- User input
- Rendering the semantic visualisation
- Interactive word positioning
- Cluster creation
- User interaction and analysis

Technologies:

- HTML
- CSS
- JavaScript
- D3.js

### Backend

The backend is responsible for:

- Processing user input
- Generating contextual embeddings
- Computing the two-dimensional semantic representation
- Returning the resulting coordinates to the frontend

Technologies:

- Python
- FastAPI
- Sentence-BERT
- UMAP

The frontend communicates with the backend through HTTP requests using JSON.

## How to Run

### Requirements

Make sure Python is installed on your system.
The project was developed using **Python 3.12.9**.

### 1. Start the Backend

Open a terminal in the project directory and run:

```bash
uvicorn main:app --reload
```

The FastAPI backend will start at:

```text
http://127.0.0.1:8000
```

Keep this terminal running while using the application.

### 2. Start the Frontend

The frontend can be started using **VS Code Live Server**.

Alternatively, open a second terminal in the project directory and run:

```bash
python -m http.server 5500
```

Then open the following address in your browser:

```text
http://localhost:5500
```

Open:

```text
index.html
```

with LiveServer to start the application.

## Academic Context

This project was developed as part of my Bachelor's thesis in Computer Science:

### *Interactive Visualisation of Semantic Word Clusters*

**Author:** Laura Scaramella

**Supervisor:** Prof. Rosella Gennari

**Co-supervisors:** Simone Ciciliano, Marco Mores

**Academic Year:** 2025/2026

**University:** Free University of Bozen-Bolzano
