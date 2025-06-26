#!/usr/bin/env python
import sys
import warnings

from datetime import datetime

from maraw.crew import Maraw

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    inputs = {
    "conf": "IEEE Transactions on Neural Networks and Learning Systems",
    "author": "Girish S, Undergraduate Researcher, Department of Computer Science, Amrita Vishwa Vidyapeetham",
    "problem_statement": "Despite progress in autism diagnosis, current methods relying on single-modal data fail to capture the complexity of ASD.",
    "proposal": "We propose a modular multi-agent system that fuses behavioral video data, eye-tracking, and questionnaire analysis to enhance ASD diagnostic accuracy.",
    "contributions": [
        "Designed a multi-modal diagnostic architecture",
        "Integrated pose analysis and literature mining agents",
        "Improved classification accuracy over baseline models"
    ],
    "results": "Our system achieved an 89.2% accuracy in ASD classification, surpassing single-modal benchmarks by 11%.",
    "title": "Advancing Autism Diagnosis with Modular Multi-Agent Systems",
    "abstract": "",
    "keywords": ["ASD Diagnosis", "Multi-Modal Learning", "Agentic Systems"],
    "images": [],
    "references": []
}

    
    try:
        Maraw().crew().kickoff(inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "topic": "AI LLMs",
        'current_year': str(datetime.now().year)
    }
    try:
        Maraw().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        Maraw().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year)
    }
    
    try:
        Maraw().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")


run()