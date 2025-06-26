import asyncio
import websockets
import json
import logging
from typing import Dict, Any
from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import SystemMessage, HumanMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clean_inputs(llm, inputs):
    system_prompt = SystemMessage(
        content=(
            "You are a data cleaning assistant. Your task is to sanitize input dictionaries used for research paper generation. "
            "Ensure the following:"
            "- Empty or missing optional fields are set to None"
            "- Remove any commentary, noise, or unrelated content"
            "- Return the cleaned content in a structured JSON-compatible dictionary"
            "- here is the datatype of each fields: conf=String, author=String, problem_statement=String, proposal=String, contributions=List(String), results=String, title=String, abstract=String, keywords=List(String), images=List(), references=List(String)"
        )
    )

    def format_prompt(input_dict):
        return [
            system_prompt,
            HumanMessage(
                content=f"""Here is an input dictionary to clean:
  {input_dict}
  Please clean it and return the cleaned dictionary. dont add any extra text and dont change the key names"""
            ),
        ]

    cleaning_chain = RunnableLambda(format_prompt) | llm
    output = cleaning_chain.invoke(inputs).content
    return eval(output)


def gen_abstract(llm_llama3_3_70B, inp2, critic=None):
    if inp2["abstract"] is None or critic is not None:
        system_msg = SystemMessage(
            content=(
                "You are an academic writing assistant tasked with generating a concise, standalone research abstract. "
                "Follow these detailed guidelines to produce a high-quality abstract:\n\n"
                "Purpose:\n"
                "- Summarize the entire research paper briefly, enabling readers to quickly grasp the problem, methodology, key findings, and implications.\n"
                "- Ensure the abstract is suitable for indexing and retrieval in academic databases and can stand alone as a summary.\n\n"
                "Word Limit:\n"
                "- Keep the abstract between 150 and 300 words, adjusting as per typical journal or conference requirements.\n"
                "- For conferences, aim for around 250 words.\n"
                "- Structured abstracts with labeled subsections may be longer; always check specific guidelines.\n\n"
                "Logical Structure:\n"
                "1. Background / Context (1–2 sentences)\n"
                "   - Introduce the broader research area and the specific problem or gap.\n"
                "   - Explain why the problem matters scientifically, practically, or clinically.\n"
                "2. Objective / Problem Statement (1 sentence)\n"
                "   - Clearly state the main goal or research question addressed.\n"
                "3. Methodology / Approach (2–3 sentences)\n"
                "   - Summarize data types, size, sources, and techniques or models used.\n"
                "   - Keep descriptions high-level and avoid technical jargon or equations.\n"
                "4. Key Results (2–3 sentences)\n"
                "   - Present the most important findings with quantitative metrics (e.g., accuracy, F1-score).\n"
                "   - Highlight comparisons with baselines or prior work if relevant.\n"
                "5. Conclusion & Significance (1–2 sentences)\n"
                "   - Summarize the impact and potential implications of the findings.\n"
                "   - Optionally mention future directions or applications.\n\n"
                "Stylistic Guidelines:\n"
                "- Write the abstract after completing the full paper.\n"
                "- Use past tense for methods and results; present tense for facts and conclusions.\n"
                "- Maintain a formal, objective tone; avoid promotional or subjective language.\n"
                "- Do not include citations, figures, or uncommon abbreviations.\n"
                "- Use precise language and quantify results wherever possible.\n\n"
                "Common Mistakes to Avoid:\n"
                "- Overloading background at the expense of findings.\n"
                "- Vague methodology descriptions.\n"
                "- Including interpretations or discussions beyond the results.\n"
                "- Using jargon or undefined acronyms.\n"
                "- Repeating exact phrases verbatim from the title or introduction.\n\n"
                "Generate a clear, concise, and well-structured abstract following these principles."
            )
        )
        human_msg = HumanMessage(
            content=(
                f"Problem statement: {inp2['problem_statement']}\n"
                f"Proposal: {inp2['proposal']}\n"
                f"Contributions: {inp2['contributions']}\n"
                f"Results: {inp2['results']}\n"
                f"Critical Guidelines: {critic}\n"
                "Please generate a single-paragraph research abstract based on the above. Strictly follow Critical Guidelines if not None."
            )
        )
        abs = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
        return abs
    else:
        return inp2["abstract"]


def gen_title(llm_llama3_3_70B, inp2, critic=None):
    if critic is not None or inp2["title"] is None:
        system_msg = SystemMessage(
            content=(
                "You are an academic writing assistant tasked with generating precise and impactful research paper titles. "
                "Your goal is to create a clear, concise, and informative title that reflects the key problem, proposed solution, and main contributions. "
                "Use an academic tone, avoid sensationalism, and ensure that the title is self-contained and relevant to the given content. "
                "Do not exceed 15 words. Do not invent or add content not present in the input."
            )
        )
        human_msg = HumanMessage(
            content=(
                f"Problem statement: {inp2['problem_statement']}\n"
                f"Proposal: {inp2['proposal']}\n"
                f"Contributions: {inp2['contributions']}\n"
                f"Results: {inp2.get('results', 'Not provided')}\n"
                f"Critical Guidelines: {critic}\n"
                "Please generate an appropriate and concise academic research paper title based on the above. Strictly follow Critical Guidelines if provided."
            )
        )
        title = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
        return title
    else:
        return inp2["title"]


def gen_intro(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating a formal, clear, and well-structured introduction section for a research paper. "
            "Follow these guidelines strictly:\n"
            "1. Start broad by introducing the general research area and its real-world or academic importance.\n"
            "2. Narrow the scope by defining the specific problem or gap, mentioning key challenges and citing related works.\n"
            "3. State the research gap or motivation clearly, explaining why the research is necessary.\n"
            "4. Present the research objective or hypothesis concisely.\n"
            "5. Optionally, summarize key contributions in a high-level manner.\n"
            "Maintain a formal and objective tone, avoid jargon or define it clearly, and ensure logical flow and coherence."
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Title: {inp2['title']}\n"
            f"Abstract: {inp2['abstract']}\n\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Contributions: {inp2['contributions']}\n"
            f"Results: {inp2['results']}\n"
            f"Critical Guidelines: {critic}\n"
            "Using the above information, write a comprehensive introduction section for the research paper. Strictly follow Critical Guidelines if not None."
            "Make sure to follow the guidelines provided in the system message."
        )
    )
    intro = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return intro


def gen_keywords(llm_llama3_3_70B, inp2, critic=None):
    if critic is not None or inp2["keywords"] is None:
        system_msg = SystemMessage(
            content=(
                "You are an academic writing assistant tasked with generating a list of effective keywords for a research paper. "
                "Follow these guidelines:\n"
                "- Reflect core concepts, main topics, methods, and scope.\n"
                "- Use terms from the paper’s title and abstract.\n"
                "- Include both broad and specific terms.\n"
                "- Think like a researcher searching in databases like PubMed, Scopus, or Google Scholar.\n"
                "- Include synonyms, variants, and widely known acronyms.\n"
                "- Avoid uncommon abbreviations and stop words (e.g., 'the', 'and', 'with').\n"
                "- Include methodological keywords if applicable.\n"
                "- Format keywords in lowercase except for acronyms and proper nouns.\n"
                "- Provide 3 to 6 keywords, separated by commas.\n"
                "Output only the list of keywords."
            )
        )

        # Human message with the paper's title and abstract
        human_msg = HumanMessage(
            content=(
                f"Title: {inp2['title']}\n"
                f"Abstract: {inp2['abstract']}\n"
                f"Existing Keywords: {inp2['keywords']}\n"
                f"Problem statement: {inp2['problem_statement']}\n"
                f"Proposal: {inp2['proposal']}\n"
                f"Contributions: {inp2['contributions']}\n"
                f"Results: {inp2['results']}\n"
                f"Introduction: {inp2['intro']}\n"
                f"Critical Guidelines: {critic}\n"
                "Please generate a list of effective keywords for the research paper based on the above information. Strictly follow Critical Guidelines if not None.\n"
            )
        )

        keyword = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
        return keyword.split(", ")
    else:
        return inp2["keywords"]


def gen_methodology_plan(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating a detailed plan and structured outline for the Methodology section of a research paper. "
            "Follow these comprehensive guidelines to ensure clarity, completeness, and academic rigor:\n\n"
            "1. Clarify the Objectives of the Study:\n"
            "   - Identify main research questions or hypotheses.\n"
            "   - Define what each part of the methodology aims to accomplish.\n"
            "   - Address what is being measured or classified and why the approach suits the problem.\n\n"
            "2. List All Components of the Experimental Setup:\n"
            "   - Datasets: source, size, class distribution, preprocessing.\n"
            "   - Hardware/Software: platforms, libraries, GPUs/CPUs.\n"
            "   - Models/Techniques: machine learning, deep learning, traditional algorithms.\n"
            "   - Feature Extraction/Input Processing: preprocessing pipelines.\n"
            "   - Evaluation Protocols: train-test splits, cross-validation, metrics.\n"
            "   - Hyperparameters & Optimization: learning rate, batch size, optimizers, epochs, loss functions.\n\n"
            "3. Create a Step-by-Step Outline:\n"
            "   - Visualize the full pipeline from data acquisition to output using bullet points.\n"
            "   - Typical flow: dataset acquisition, preprocessing, feature extraction, model design, training, evaluation, comparative experiments.\n\n"
            "4. Gather and Organize Justifications for Each Choice:\n"
            "   - Tools or algorithms used and reasons for their selection.\n"
            "   - Justify preprocessing and data transformations.\n"
            "   - Explain suitability of evaluation metrics.\n\n"
            "5. Document Every Experimental Setting in Detail:\n"
            "   - Dataset versions, random seeds, hardware specs, training times, model architecture details.\n\n"
            "6. Identify Variants or Ablation Studies:\n"
            "   - Log comparisons, ablation experiments, feature tests clearly.\n\n"
            "7. Align With Reporting Standards in Your Field:\n"
            "   - Follow field-specific guidelines (e.g., PRISMA, IEEE).\n\n"
            "8. Anticipate Reviewer Questions:\n"
            "   - Ensure reproducibility, fairness, standard techniques, and documented hyperparameters.\n\n"
            "9. Decide What to Include in Main Text vs Supplementary Material:\n"
            "   - Determine placement of detailed grids, tables, code snippets.\n\n"
            "10. Pre-Writing Checklist:\n"
            "   - Objectives defined and addressed.\n"
            "   - Pipeline stages outlined.\n"
            "   - Justifications prepared.\n"
            "   - Technical settings documented.\n"
            "   - Alignment with field expectations.\n"
            "   - Clear inclusion plan for main section.\n\n"
            "Generate a comprehensive, logically organized plan and structured outline for the Methodology section based on the input details, find and use more information as you see fit for generating the response."
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Abstract: {inp2['abstract']}\n"
            f"Introduction: {inp2['intro']}\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Contributions: {inp2['contributions']}\n"
            f"Results: {inp2['results']}\n"
            f"Critical Guidelines: {critic}\n"
            "Please generate a detailed plan and structured outline for the Methodology section accordingly. Strictly follow Critical Guidelines if not None."
        )
    )

    methodology_plan = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return methodology_plan


def gen_methodology(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating the Methodology section of a research paper. "
            "Follow these detailed guidelines to produce a clear, comprehensive, and reproducible Methodology section:\n\n"
            "Purpose:\n"
            "- Explain how the research was conducted, detailing data, tools, models, and processes.\n"
            "- Ensure other researchers can replicate or evaluate the study fully.\n\n"
            "Logical Ordering of Subsections:\n"
            "- Organize in the sequence of the research pipeline:\n"
            "  Overview (optional), Dataset Description, Data Preprocessing, Feature Extraction/Input Representation,\n"
            "  Model Architecture/Algorithm Design, Training Setup and Hyperparameters, Evaluation Metrics and Protocol,\n"
            "  Baseline Models/Comparative Setup (if applicable).\n"
            "- Clearly label each subsection.\n\n"
            "Detailed Instructions for Each Subsection:\n"
            "1. Overview/Methodological Framework (optional): summarize full pipeline and key techniques.\n"
            "2. Dataset Description: name datasets, size, classes, modalities, source, ethics, availability.\n"
            "3. Data Preprocessing: cleaning steps, tools, parameters, reproducibility details.\n"
            "4. Feature Extraction/Input Representation: data transformation, models used, input structure.\n"
            "5. Model Architecture/Algorithm: detailed architecture, layers, parameters, novel designs.\n"
            "6. Training Setup and Hyperparameters: data splits, optimizer, loss, learning rate, hardware, seed.\n"
            "7. Evaluation Metrics and Protocol: metrics used, rationale, calculation methods.\n"
            "8. Baseline/Comparative Models: description, source, evaluation alignment.\n\n"
            "Writing and Formatting Guidelines:\n"
            "- Use past tense and objective, factual language.\n"
            "- Use subheadings for readability.\n"
            "- Include figures/diagrams if allowed.\n"
            "- Avoid unnecessary equations unless explaining novel methods.\n\n"
            "Common Mistakes to Avoid:\n"
            "- Omitting key details, mixing results or analysis, vague descriptions, missing rationale, unspecified tools.\n\n"
            "Final Checklist:\n"
            "- Clear description of pipeline steps.\n"
            "- Specified tools, frameworks, versions.\n"
            "- Reproducibility ensured.\n"
            "- Logical flow and subheadings.\n"
            "- Explained parameters, metrics, evaluation.\n\n"
            "Generate a detailed, well-structured Methodology section based on the following plan."
            "If there is not enough content for a sub-section, merge it into similar sub-sections\n"
            "Keep the subsections and sub-sub-sections to a minimum. Only include important and highly used sections commonly found in research papers.\n"
            "Title the subsections accordingly and only use commonly used subsection names. If a subsection is not commonly found, merge it into similar subsections or keep it as plain text without a title."
            "Explain key concepts if not explained already."
            "Keep at least 100-250 words in each subsection, if there is not enough content generate more relevant content as you see fit, if still not enough merge with other subsections"
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Methodology plan and structure:\n{inp2['meth_plan']}\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Results: {inp2['results']}\n"
            f"Critical Guidelines: {critic}\n"
            "Please generate the full Methodology section text accordingly. Strictly follow Critical Guidelines if not None."
        )
    )
    methodology = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return methodology


def gen_results(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating the Results section of a research paper. "
            "Follow these guidelines:\n"
            "- Objectively present core findings derived from data analysis without interpretation or discussion.\n"
            "- Keep the section clear, concise, and logically organized.\n"
            "- Use descriptive language, avoid speculation.\n"
            "- Report all key findings, including negative or non-significant results.\n"
            "- Quantify results with actual values and include comparative performance where applicable.\n"
            "- Follow the order of research questions or hypotheses.\n"
            "- Group related results into subsections if needed.\n"
            "- Refer explicitly to figures and tables without duplicating data.\n"
            "- Use consistent terminology and abbreviations.\n"
            "- Keep the length appropriate (typically 500-1000 words).\n"
            "- Avoid mixing interpretation or discussion.\n"
            "Generate a concise, well-ordered Results section based on the input data.\n"
            "Provide the section as normal text content without any formatting or structural addition."
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Title: {inp2['title']}\n"
            f"Abstract: {inp2['abstract']}\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Contributions: {inp2['contributions']}\n"
            f"Results: {inp2['results']}\n"
            f"Critical Guidelines: {critic}\n"
            "Please generate the Results section text accordingly. Strictly follow Critical Guidelines if not None."
        )
    )
    result = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return result


def gen_discussion(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating the Discussion section of a research paper. "
            "Follow these detailed guidelines to produce a well-structured, insightful, and academically rigorous discussion:\n\n"
            "Purpose:\n"
            "- Interpret the significance of the findings in light of research objectives, existing literature, and broader implications.\n"
            "- Explain why the results matter, how they compare to previous work, and what future directions arise.\n\n"
            "Word Limit:\n"
            "- Typically 800–1500 words depending on study complexity.\n"
            "- Short communications ~500 words.\n"
            "- Full-length papers may go up to 2000 words.\n\n"
            "Logical Structure & Organization:\n"
            "1. Restate Key Findings (1 paragraph):\n"
            "   - Summarize main results relevant to interpretation without repeating numbers.\n"
            "   - Emphasize novelty or most important outcomes.\n"
            "2. Interpretation of Findings (2–4 paragraphs):\n"
            "   - Explain meaning in context of research questions.\n"
            "   - Discuss reasons for results, supported by reasoning or literature.\n"
            "   - Explore mechanisms, theoretical implications, and unexpected findings.\n"
            "3. Comparison with Previous Work (2–3 paragraphs):\n"
            "   - Compare results with similar studies or models.\n"
            "   - Highlight agreements, extensions, or contradictions.\n"
            "   - Explain contributions to existing knowledge.\n"
            "4. Strengths and Novel Contributions (1–2 paragraphs):\n"
            "   - Emphasize unique, innovative, or impactful aspects.\n"
            "   - State contributions factually and confidently.\n"
            "5. Limitations of the Study (1 paragraph):\n"
            "   - Transparently discuss methodological or scope limitations.\n"
            "   - Avoid defensive language; present as areas for refinement.\n"
            "6. Future Work and Recommendations (1–2 paragraphs):\n"
            "   - Suggest next steps linked to outcomes and limitations.\n"
            "   - Include new datasets, evaluations, deployments, or improvements.\n"
            "7. Conclusion-Like Final Sentence (Optional):\n"
            "   - End with a strong forward-looking statement without summarizing again.\n\n"
            "Stylistic and Content Guidelines:\n"
            "- Use present tense for discussing results and interpretation.\n"
            "- Use past tense for describing what was done.\n"
            "- Avoid repeating technical details; focus on meaning and context.\n"
            "- Ensure logical flow and clear paragraph topics.\n"
            "- Maintain a neutral, academic tone without hype or emotion.\n\n"
            "Common Mistakes to Avoid:\n"
            "- Repeating results without interpretation.\n"
            "- Unsupported claims or ignoring contradictory findings.\n"
            "- Downplaying limitations or introducing new data.\n"
            "- Overloading citations without synthesis.\n\n"
            "Final Checklist:\n"
            "- Clearly explain meaning and relevance of findings.\n"
            "- Organize discussion logically.\n"
            "- Compare with related literature.\n"
            "- Acknowledge limitations.\n"
            "- Offer specific future research suggestions.\n"
            "- Keep writing concise and focused.\n\n"
            "Generate a comprehensive, well-organized Discussion section based on the input provided."
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Abstract: {inp2['abstract']}\n"
            f"Introduction: {inp2['intro']}\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Contributions: {inp2['contributions']}\n"
            f"Results: {inp2['results']}\n"
            f"Result Section: {inp2['results_sec']}\n"
            f"Critical Guidelines: {critic}\n"
            "Please generate the Discussion section text accordingly. Strictly follow Critical Guidelines if not None."
        )
    )

    disc = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return disc


def gen_conclusion(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(
        content=(
            "You are an academic writing assistant tasked with generating the Conclusion section of a research paper. "
            "Follow these guidelines:\n"
            "- Provide a concise synthesis of the study’s findings without repeating details.\n"
            "- Restate the research purpose in 1–2 sentences using different phrasing than the introduction.\n"
            "- Summarize key findings in 2–3 sentences, focusing on what was achieved.\n"
            "- Discuss implications and significance in 2–4 sentences, highlighting relevance.\n"
            "- Optionally acknowledge limitations briefly and non-defensively.\n"
            "- Suggest future work in 1–3 sentences, being specific if possible.\n"
            "- Maintain a neutral, confident tone without overstatements or hedging.\n"
            "- Avoid introducing new data or concepts.\n"
            "- Keep the conclusion concise (typically 150–300 words).\n"
            "- Find and use more information as you see fit for this section"
            "Generate a clear, focused, and forward-looking Conclusion section based on the input."
        )
    )

    human_msg = HumanMessage(
        content=(
            f"Abstract: {inp2['abstract']}\n"
            f"Introduction: {inp2['intro']}\n"
            f"Problem statement: {inp2['problem_statement']}\n"
            f"Proposal: {inp2['proposal']}\n"
            f"Contributions: {inp2['contributions']}\n"
            f"Results: {inp2['results']}\n"
            f"Critical Guidelines: {critic}\n"
            "Please generate the Conclusion section text accordingly. Strictly follow Critical Guidelines if not None."
        )
    )

    concl = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return concl


def gen_critic(crew, section, text, threshold):
    result = crew.kickoff(inputs={"section_name": section, "section_content": text})
    score = int("".join(filter(str.isdigit, result.tasks_output[0].raw)))
    if score < threshold:
        critic = result.tasks_output[1].raw
    else:
        return ""


critic_agent = Agent(
    role="Research Paper Critic",
    goal="Evaluate and suggest improvements for research paper sections",
    backstory=(
        "You are a top-tier academic reviewer with a critical eye for clarity, structure, and academic rigor. "
        "You're known for providing fair, insightful, and actionable feedback to elevate writing quality."
    ),
    verbose=False,
    allow_delegation=False,
    memory=True,
    reasoning=True,
    llm="groq/llama-3.3-70b-versatile",
)

# --------------------------
# Task 1: Scoring Task
# --------------------------
score_task = Task(
    description=(
        "Evaluate the research paper section titled '{section_name}'.\n\n"
        "Critically assess it for clarity, academic depth, coherence, and relevance.\n"
        "Evaluate the section using the following four criteria:\n"
        "1. Clarity – Is the writing clear, precise, and easy to follow? Are sentences well-constructed and terminology appropriately used?\n"
        "2. Coherence – Is there a logical progression of ideas? Are transitions smooth and does the section stay focused on its purpose?\n"
        "3. Completeness – Does the section include all information expected for its type (e.g., problem framing in Introduction, numerical results in Results, etc.)?\n"
        "4. Academic Rigor – Is the tone scholarly? Are claims appropriately supported? Are methods, results, or arguments presented with sufficient precision and formality?\n"
        "Then assign a score between 0 and 100.\n\n"
        "Do not output anything other than the score, no texts or reasoning."
        "**Output format MUST be:**\n"
        "`<score>`\n"
    ),
    expected_output="<score>",
    agent=critic_agent,
)

# --------------------------
# Task 2: Suggestion Task
# --------------------------
suggestion_task = Task(
    description=(
        "Provide improvement suggestions for the section '{section_name}' "
        "Focus on the clarity of expression, argument flow, technical depth, and structure.\n"
        "Be critical and constructive.\n\n"
        "- Begin by identifying any specific weaknesses or omissions in the content, such as lack of detail, unsupported claims, vague or ambiguous language, or missing structural elements expected for the section type.\n"
        "- Evaluate whether the logical structure is sound. If not, indicate what reordering, expansion, or clarification would improve coherence.\n"
        "- Assess stylistic tone. Highlight overly casual, informal, or ambiguous phrasing and suggest more academic alternatives.\n"
        "- Examine the use of terminology. Point out misuse, overuse, or undefined terms.\n"
        "- Consider completeness. Indicate if any expected components are missing (e.g., no methodological description in a Methods section, or missing limitations in a Discussion).\n"
        "- Provide specific, actionable recommendations for improvement. For example, recommend rewriting a particular sentence, adding a justification for a claim, restructuring a paragraph, or referencing appropriate literature.\n"
        "- Avoid generic feedback. All observations must directly relate to the specific content provided.\n"
        "- Maintain a respectful and professional tone throughout. Avoid exaggeration or harsh phrasing.\n"
        "Overall Provide only meaningfull suggestion, that you would provide for a {section_name} section."
    ),
    expected_output="bulleted improvement suggestions.",
    agent=critic_agent,
)

inp2 = {}


class AgentOrchestrator:
    def __init__(self):
        self.agents = [
            "Planner",
            "Content Generator",
            "Citation Manager",
            "Critic",
            "Plagiarism Watchdog",
            "Code Formatter",
        ]
        self.steps = []
        self.inputs = {}
        self.llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
            api_key="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",
        )
        self.crew = Crew(
            agents=[critic_agent],
            tasks=[score_task, suggestion_task],
            process=Process.sequential,
            verbose=False,
        )

    async def process_user_input(self, user_input: str, websocket):
        """
        Main function to process user input and generate agent responses.
        This is where you integrate your custom backend functions.

        Args:
            user_input (str): The user's message
            websocket: WebSocket connection to send messages back to client

        Returns:
            None (messages are sent directly to client via websocket)
        """

        # Example: Parse user input and determine what agents should respond
        responses = await self.generate_agent_responses(user_input)

        # Send each response to the client
        for response in responses:
            await self.send_agent_message(
                websocket, response["agent"], response["reasoning"], response["message"]
            )

            # Optional: Add small delay between messages for better UX
            await asyncio.sleep(0.5)

    async def generate_agent_responses(self, user_input: str):
        """
        Generate agent responses based on user input.
        Replace this with your custom backend logic.

        Args:
            user_input (str): The user's message

        Returns:
            List[Dict]: List of agent responses
        """

        # TODO: Replace this with your actual backend processing
        # This is where you would call your parsing functions and generate responses

        # Example logic - replace with your functions:
        responses = []
        global inp2

        if self.steps[-1] == "title":
            self.inputs["title"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter your conference or journal's name.",
                }
            )
            self.steps.append("conf")
        elif self.steps[-1] == "conf":
            self.inputs["conf"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the author's names and designation. (e.g., Name;Designation, Name;Designation, etc.).",
                }
            )
            self.steps.append("auth")
        elif self.steps[-1] == "auth":
            self.inputs["auth"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the Main Problem Statement of the research.",
                }
            )
            self.steps.append("problem_statement")
        elif self.steps[-1] == "problem_statement":
            self.inputs["problem_statement"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the proposed solution of the research.",
                }
            )
            self.steps.append("proposal")
        elif self.steps[-1] == "proposal":
            self.inputs["proposal"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the contribution's of your research to the domain. Seperate each contribution with ';'.",
                }
            )
            self.steps.append("contributions")
        elif self.steps[-1] == "contributions":
            self.inputs["contributions"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the Results of your research. Please provide as much information as you can.",
                }
            )
            self.steps.append("results")
        elif self.steps[-1] == "results":
            self.inputs["results"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please enter the abstract of your research if you have one.",
                }
            )
            self.steps.append("abstract")
        elif self.steps[-1] == "abstract":
            self.inputs["abstract"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please Enter your Keywords if you have.",
                }
            )
            self.steps.append("keywords")
        elif self.steps[-1] == "keywords":
            self.inputs["keywords"] = user_input
            responses.append(
                {
                    "agent": "Planner",
                    "reasoning": "",
                    "message": "Please Enter your References if you have.",
                }
            )
            self.steps.append("references")
        elif self.steps[-1] == "references":
            self.inputs["references"] = user_input
            inp2 = clean_inputs(self.llm, self.inputs)
            abstract = gen_abstract(self.llm, inp2)
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Abstract: \n" + abstract,
                }
            )
            self.steps.append("abstract")
            inp2["abstract"] = abstract
            self.inp2 = inp2
        elif self.steps[-1] == "abstract":
            title = gen_title(self.llm, self.inp2)
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Title: \n" + title,
                }
            )
            self.inp2["title"] = title
            self.steps.append("title")
        elif self.steps[-1] == "title":
            intro = gen_intro(self.llm, self.inp2)
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Introduction: \n" + intro,
                }
            )
            self.inp2["intro"] = intro
            self.steps.append("intro")
        elif self.steps[-1] == "intro":
            keywords = gen_keywords(self.llm, self.inp2)
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Keywords: \n" + keywords,
                }
            )
            self.inp2["keywords"] = keywords
            self.steps.append("keywords")
        elif self.steps[-1] == "keywords":
            meth_plan = gen_methodology_plan(self.llm, self.inp2)
            self.inp2["meth_plan"] = meth_plan
            methodology = gen_methodology(self.llm, self.inp2)
            self.inp2["methodology"] = methodology
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": meth_plan,
                    "message": "Methodology: \n" + methodology,
                }
            )
            self.steps.append("methodology")
        elif self.steps[-1] == "methodology":
            results = gen_results(self.llm, self.inp2)
            self.inp2["results"] = results
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Results: \n" + results,
                }
            )
            self.steps.append("results")
        elif self.steps[-1] == "results":
            discussion = gen_discussion(self.llm, self.inp2)
            self.inp2["discussion"] = discussion
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Discussion: \n" + discussion,
                }
            )
            self.steps.append("discussion")
        elif self.steps[-1] == "discussion":
            conclusion = gen_conclusion(self.llm, self.inp2)
            self.inp2["conclusion"] = conclusion
            responses.append(
                {
                    "agent": "Content Generator",
                    "reasoning": "",
                    "message": "Conclusion: \n" + conclusion,
                }
            )

        return responses

    async def send_agent_message(
        self, websocket, agent: str, reasoning: str, message: str
    ):
        """Send a single agent message to the client"""
        try:
            response = {
                "type": "agent_message",
                "agent": agent,
                "reasoning": reasoning,
                "message": message,
                "timestamp": asyncio.get_event_loop().time(),
            }
            await websocket.send(json.dumps(response))
            logger.info(f"Sent message from {agent}")
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Failed to send message - client disconnected")
        except Exception as e:
            logger.error(f"Error sending message: {e}")


class WebSocketServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.orchestrator = AgentOrchestrator()
        self.connected_clients = set()

    async def register_client(self, websocket):
        """Register a new client connection"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.connected_clients)}")

    async def unregister_client(self, websocket):
        """Remove client connection"""
        self.connected_clients.discard(websocket)
        logger.info(
            f"Client disconnected. Total clients: {len(self.connected_clients)}"
        )

    async def send_message(self, websocket, agent: str, reasoning: str, message: str):
        """Send a structured message to client"""
        try:
            response = {
                "type": "agent_message",
                "agent": agent,
                "reasoning": reasoning,
                "message": message,
                "timestamp": asyncio.get_event_loop().time(),
            }
            await websocket.send(json.dumps(response))
            logger.info(f"Sent message from {agent} to client")
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Failed to send message - client disconnected")

    async def handle_client_message(self, websocket, message_data: Dict[str, Any]):
        """
        Process incoming client message and call your custom processing functions.
        This is the main entry point for your backend logic.
        """
        try:
            user_input = message_data.get("message", "")
            logger.info(f"Received user input: {user_input}")

            # MAIN INTEGRATION POINT:
            # Call your custom processing function
            await self.orchestrator.process_user_input(user_input, websocket)

        except Exception as e:
            logger.error(f"Error processing client message: {e}")
            error_response = {
                "type": "error",
                "message": f"Error processing request: {str(e)}",
            }
            await websocket.send(json.dumps(error_response))

    # Utility methods for your custom functions to use:

    async def send_agent_response(
        self, websocket, agent: str, reasoning: str, message: str
    ):
        """
        Utility method for your custom functions to send messages to clients.
        Use this in your custom functions to send responses.
        """
        await self.send_message(websocket, agent, reasoning, message)

    async def send_multiple_responses(self, websocket, responses: list):
        """
        Send multiple agent responses at once.

        Args:
            websocket: Client connection
            responses: List of dicts with keys: 'agent', 'reasoning', 'message'
        """
        for response in responses:
            await self.send_message(
                websocket, response["agent"], response["reasoning"], response["message"]
            )
            # Small delay between messages for better UX
            await asyncio.sleep(2)

    def get_user_input_from_message(self, message_data: Dict[str, Any]) -> str:
        """Extract user input from message data"""
        return message_data.get("message", "")

    # Your custom functions can access these methods:
    # - self.send_agent_response(websocket, agent, reasoning, message)
    # - self.send_multiple_responses(websocket, responses_list)
    # - User input is available in handle_client_message

    async def handle_client(self, websocket):
        """Handle individual client connection"""
        await self.register_client(websocket)

        try:
            # Send initial welcome message

            await self.send_multiple_responses(
                websocket,
                [
                    {
                        "agent": "System",
                        "reasoning": "Client connection established, ready to process requests",
                        "message": "Connected to MARAW Backbone. Running Crew...",
                    },
                    {
                        "agent": "Planner",
                        "reasoning": "",
                        "message": "Please enter the title of the project",
                    },
                ],
            )
            self.orchestrator.steps.append("title")

            async for message in websocket:
                try:
                    message_data = json.loads(message)
                    logger.info(f"Received: {message_data}")

                    if message_data.get("type") == "user_message":
                        await self.handle_client_message(websocket, message_data)
                    else:
                        logger.warning(
                            f"Unknown message type: {message_data.get('type')}"
                        )

                except json.JSONDecodeError:
                    logger.error("Invalid JSON received from client")
                    error_response = {"type": "error", "message": "Invalid JSON format"}
                    await websocket.send(json.dumps(error_response))

        except websockets.exceptions.ConnectionClosed:
            logger.info("Client connection closed")
        except Exception as e:
            logger.error(f"Error in client handler: {e}")
        finally:
            await self.unregister_client(websocket)

    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"Starting WebSocket server on {self.host}:{self.port}")

        # Updated for newer websockets library versions
        start_server = websockets.serve(
            self.handle_client, self.host, self.port, ping_interval=20, ping_timeout=10
        )

        server = await start_server
        logger.info("WebSocket server started successfully")

        # Keep the server running
        await server.wait_closed()


def main():
    server = WebSocketServer()
    try:
        # Create and run the event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(server.start_server())
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        loop.close()


if __name__ == "__main__":
    main()
