from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from typing import List, Dict
from itertools import combinations

import numpy as np
import random
import torch
#import json
#import requests
#import os




#import gc

from sentence_transformers import util
from sentence_transformers import SentenceTransformer
import umap.umap_ as umap





# create endpoint
app = FastAPI()


# allow frontend access since backend and frontend have different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

seed_ = 42

# Load model once
model = SentenceTransformer('nickprock/sentence-bert-base-italian-uncased')

@app.on_event("startup")
def startup_event():
    model.encode("warmup")

# schema request: JSON with context and keyword
# Backend receives this data model
class RequestData(BaseModel): 
    context: str
    keywords: str


def get_embeddings(inputs, context):
    np.random.seed(seed_)
    random.seed(seed_)
    torch.manual_seed(seed_)

    inputs = inputs.split(", ")
    with torch.no_grad():
        embeddings = [
            model.encode(f"{context} {inp}")
            for inp in inputs
        ]
    return {k: v for k, v in zip(inputs, embeddings)}

def embeddings_umap(embeddings):
    labels = list(embeddings.keys())
    vecs = np.array([embeddings[k] for k in labels])

    reducer = umap.UMAP(
        random_state=seed_,
        n_neighbors=15,
        min_dist=0.1,
        n_components=2
    )

    vecs_2d = reducer.fit_transform(vecs)
    return {k: v for k, v in zip(labels, vecs_2d)}
    


@app.post("/data")
def get_data(req: RequestData):

    embs = get_embeddings(req.keywords, req.context)
    embs_2d = embeddings_umap(embs)

    # returns word with x, y coord in JSON format
    result = []
    for k, v in embs_2d.items():
        result.append({
            "label": k,
            "x": float(v[0]),
            "y": float(v[1])
        })

    return result



