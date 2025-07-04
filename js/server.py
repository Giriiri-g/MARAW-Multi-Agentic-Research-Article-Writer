from crewai import Agent, Task, Crew, Process, LLM
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnableLambda
from langchain_core.messages import SystemMessage, HumanMessage
import asyncio
import websockets
import json
import time
import os
import subprocess
import tempfile
from pathlib import Path

# Global variables
clients = {}

async def send_message(websocket, agent, reasoning, message):
    """Send message to client"""
    response = {
        "type": "agent_message",
        "agent": agent,
        "reasoning": reasoning,
        "message": message,
        "timestamp": time.time(),
    }
    await websocket.send(json.dumps(response))

async def wait_for_input(websocket, agent, reasoning, message):
    """Send prompt and wait for user input"""
    await send_message(websocket, agent, reasoning, message)
    user_response = await websocket.recv()
    return json.loads(user_response).get('message', '').strip()

def compile_latex_to_pdf(latex_content, output_dir):
    """Compile LaTeX content to PDF using pdflatex"""
    try:
        # Create temporary tex file
        tex_file = os.path.join(output_dir, "paper.tex")
        pdf_file = os.path.join(output_dir, "paper.pdf")
        
        # Write LaTeX content to file
        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_content)
        
        # Compile with pdflatex (run twice for references)
        for _ in range(2):
            result = subprocess.run([
                'pdflatex', 
                '-output-directory', output_dir,
                '-interaction=nonstopmode',
                tex_file
            ], capture_output=True, text=True, cwd=output_dir)
            
            if result.returncode != 0:
                print(f"LaTeX compilation error: {result.stderr}")
                return None
        
        if os.path.exists(pdf_file):
            return pdf_file
        else:
            return None
            
    except FileNotFoundError:
        print("pdflatex not found. Install LaTeX distribution (MiKTeX/TeX Live)")
        return None
    except Exception as e:
        print(f"Error compiling LaTeX: {e}")
        return None

async def send_file(websocket, file_path, file_type="tex"):
    """Send file to client as base64"""
    try:
        with open(file_path, 'rb') as f:
            file_data = base64.b64encode(f.read()).decode()
        
        filename = os.path.basename(file_path)
        
        response = {
            "type": "file_download",
            "agent": "System",
            "reasoning": f"Sending {file_type.upper()} file for download",
            "message": f"📄 {filename} ready for download",
            "file_data": file_data,
            "filename": filename,
            "file_type": file_type,
            "timestamp": time.time(),
        }
        
        await websocket.send(json.dumps(response))
        return True
        
    except Exception as e:
        await send_message(websocket, "System", "File send error", f"❌ Error sending file: {str(e)}")
        return False

def clean_inputs(llm_llama3_3_70B, inputs):
  system_prompt = SystemMessage(
      content=(
          "You are a data cleaning assistant. Your task is to sanitize input dictionaries used for research paper generation. "
          "Ensure the following:"
          "- Empty or missing optional fields are set to None"
          "- Remove any commentary, noise, or unrelated content"
          "- Return the cleaned content in a structured JSON-compatible dictionary"
      )
  )

  def format_prompt(input_dict):
      return [
          system_prompt,
          HumanMessage(
              content=f"""Here is an input dictionary to clean:
  {input_dict}
  Please clean it and return the cleaned dictionary. dont add any extra text and dont change the key names"""
          )
      ]

  cleaning_chain = RunnableLambda(format_prompt) | llm_llama3_3_70B
  output = cleaning_chain.invoke(inputs).content
  return eval(output)

def gen_abstract(llm_llama3_3_70B, inp2, critic=None):
  if inp2['abstract'] is None or critic is not None:
    system_msg = SystemMessage(content=(
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
    ))
    human_msg = HumanMessage(content=(
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate a single-paragraph research abstract based on the above. Strictly follow Critical Guidelines if not None."
    ))
    abs=llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return abs
  else:
    return inp2['abstract']

def gen_title(llm_llama3_3_70B, inp2, critic=None):
  if critic is not None or inp2['title'] is None:
    system_msg = SystemMessage(content=(
      "You are an academic writing assistant tasked with generating precise and impactful research paper titles. "
      "Your goal is to create a clear, concise, and informative title that reflects the key problem, proposed solution, and main contributions. "
      "Use an academic tone, avoid sensationalism, and ensure that the title is self-contained and relevant to the given content. "
      "Do not exceed 15 words. Do not invent or add content not present in the input."
    ))
    human_msg = HumanMessage(content=(
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2.get('results', 'Not provided')}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate an appropriate and concise academic research paper title based on the above. Strictly follow Critical Guidelines if provided."
    ))
    title = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return title
  else:
    return inp2['title']

def gen_intro(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
      "You are an academic writing assistant tasked with generating a formal, clear, and well-structured introduction section for a research paper. "
      "Follow these guidelines strictly:\n"
      "1. Start broad by introducing the general research area and its real-world or academic importance.\n"
      "2. Narrow the scope by defining the specific problem or gap, mentioning key challenges and citing related works.\n"
      "3. State the research gap or motivation clearly, explaining why the research is necessary.\n"
      "4. Refer briefly to existing methods, models, or literature trends that attempt to solve the identified problem, without citing sources explicitly.\n"
      "5. Present the research objective or hypothesis concisely.\n"
      "6. Optionally, summarize key contributions in a high-level manner.\n"
      "Maintain a formal and objective tone, avoid jargon or define it clearly, and ensure logical flow and coherence."
  ))

  human_msg = HumanMessage(content=(
      f"Title: {inp2['title']}\n"
      f"Abstract: {inp2['abstract']}\n\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Using the above information, write a comprehensive introduction section for the research paper. Strictly follow Critical Guidelines if not None."
      "Make sure to follow the guidelines provided in the system message."
  ))
  intro = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return intro

def gen_keywords(llm_llama3_3_70B, inp2, critic=None):
  if critic is not None or inp2['keywords'] is None:
    system_msg = SystemMessage(content=(
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
    ))

    # Human message with the paper's title and abstract
    human_msg = HumanMessage(content=(
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
    ))

    keyword=llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return keyword
  else:
    return inp2['keywords']

def gen_related_work(llm_llama3_3_70B, inp2, critic=None):
    system_msg = SystemMessage(content=(
        "You are an academic writing assistant tasked with generating the 'Related Work' section of a formal research paper. "
        "Your objective is to produce a comprehensive, critical, and well-structured review of previous work that directly relates to the problem, methodology, and domain of the current study. "
        "Follow these detailed and strictly enforced guidelines to ensure academic depth, logical organization, and clarity:\n\n"

        "Purpose and Role of the Section:\n"
        "- Provide essential background to contextualize your work.\n"
        "- Critically assess prior research relevant to your problem, dataset, methods, or target application.\n"
        "- Establish what has already been done and identify where your work differs, improves, or fills a gap.\n"
        "- Build a logical basis for your study’s novelty and justification.\n\n"

        "Structural Guidelines:\n"
        "- Begin with a high-level paragraph summarizing the broad research area (e.g., deep learning in autism diagnosis).\n"
        "- Divide the section into clearly delineated thematic categories (e.g., image-based approaches, behavioral modeling, questionnaire analysis, multimodal learning, etc.) if applicable.\n"
        "- Within each theme, present prior work in a logical order (chronological or by impact/relevance).\n"
        "- End each thematic subsection with a brief comparative insight or limitation that motivates your study.\n"
        "- Conclude the entire section with a paragraph that summarizes the gap or insufficiency in prior work that your study addresses.\n\n"

        "Reasoning and Critical Thinking Instructions:\n"
        "- Go beyond description. For each related study or group of studies:\n"
        "   • Describe what problem it addressed.\n"
        "   • Summarize the approach or methodology used.\n"
        "   • Report outcomes or findings in neutral terms.\n"
        "   • Comment on strengths or innovations (if any).\n"
        "   • Point out limitations or constraints (e.g., small datasets, single modality, generalizability issues).\n"
        "- Avoid merely stating that a method exists; explain its relevance or irrelevance to your approach.\n"
        "- Carefully reason how your method compares in scope, technique, or result—without exaggeration or subjective language.\n\n"

        "Stylistic and Writing Rules:\n"
        "- Use a formal and analytical tone throughout.\n"
        "- Use present tense when referring to facts or methods still in use; past tense for describing individual study results.\n"
        "- Do not repeat results or contributions already stated in the introduction.\n"
        "- Avoid excessive quotations or namedropping without context.\n"
        "- Avoid vague statements like 'Many studies have used AI' without specificity.\n"
        "- Do not use bullet points in the final output.\n\n"

        "Common Mistakes to Avoid:\n"
        "- Listing studies without linking them logically.\n"
        "- Using citations without describing what the cited work actually did.\n"
        "- Repeating your own study’s methods or results—focus only on prior work.\n"
        "- Making unsubstantiated claims about being the 'first' or 'only' approach.\n"
        "- Ignoring relevant but contradictory studies.\n\n"

        "Success Criteria:\n"
        "- Clear thematic grouping of studies.\n"
        "- Critical, reasoned comparison with your work.\n"
        "- Logical transition between paragraphs.\n"
        "- Final paragraph that clearly articulates the research gap your paper fills.\n"
        "- Section length appropriate for a journal (typically 600–1200 words).\n\n"

        "Generate a coherent, insightful, and properly structured Related Work section based strictly on the input provided."
    ))

    human_msg = HumanMessage(content=(
        f"Title: {inp2['title']}\n"
        f"Abstract: {inp2['abstract']}\n"
        f"Introduction: {inp2['intro']}\n"
        f"Problem Statement: {inp2['problem_statement']}\n"
        f"Proposal: {inp2['proposal']}\n"
        f"Contributions: {inp2['contributions']}\n"
        f"Results: {inp2['results']}\n"
        f"Critical Guidelines: {critic if critic else 'None'}\n\n"
        "Using the above information, write the Related Work section of the paper.\n"
        "- Do not discuss the current work directly except for drawing contrasts at the end.\n"
        "- If relevant, organize prior work by subfields (e.g., image-based methods, behavioral analysis, etc.).\n"
        "- Emphasize the methodologies and their limitations, and how they relate to your study’s direction.\n"
        "- Follow the reasoning and structural instructions in the system message strictly."
    ))

    related_work = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
    return related_work


def gen_methodology_plan(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
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
  ))

  human_msg = HumanMessage(content=(
      f"Abstract: {inp2['abstract']}\n"
      f"Introduction: {inp2['intro']}\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate a detailed plan and structured outline for the Methodology section accordingly. Strictly follow Critical Guidelines if not None."
  ))

  methodology_plan = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return methodology_plan

def gen_methodology(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
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
  ))

  human_msg = HumanMessage(content=(
      f"Methodology plan and structure:\n{inp2['meth_plan']}\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate the full Methodology section text accordingly. Strictly follow Critical Guidelines if not None."
  ))
  methodology = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return methodology

def gen_results(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
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
      "- Where applicable, describe performance trends or error patterns."
      "- Include non-significant or negative results to maintain transparency."
      "Generate a concise, well-ordered Results section based on the input data.\n"
      "Provide the section as normal text content without any formatting or structural addition."
  ))

  human_msg = HumanMessage(content=(
      f"Title: {inp2['title']}\n"
      f"Abstract: {inp2['abstract']}\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate the Results section text accordingly. Strictly follow Critical Guidelines if not None."
  ))
  result = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return result

def gen_discussion(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
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
  ))

  human_msg = HumanMessage(content=(
      f"Abstract: {inp2['abstract']}\n"
      f"Introduction: {inp2['intro']}\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Result Section: {inp2['results_sec']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate the Discussion section text accordingly. Strictly follow Critical Guidelines if not None."
  ))

  disc = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return disc

def gen_conclusion(llm_llama3_3_70B, inp2, critic=None):
  system_msg = SystemMessage(content=(
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
  ))

  human_msg = HumanMessage(content=(
      f"Abstract: {inp2['abstract']}\n"
      f"Introduction: {inp2['intro']}\n"
      f"Problem statement: {inp2['problem_statement']}\n"
      f"Proposal: {inp2['proposal']}\n"
      f"Contributions: {inp2['contributions']}\n"
      f"Results: {inp2['results']}\n"
      f"Critical Guidelines: {critic}\n"
      "Please generate the Conclusion section text accordingly. Strictly follow Critical Guidelines if not None."
  ))

  concl = llm_llama3_3_70B.invoke([system_msg, human_msg]).content
  return concl

def gen_critic(crew, section, text, threshold):
  result = crew.kickoff(inputs={"section_name":section, "section_content":text})
  score = int("".join(filter(str.isdigit, result.tasks_output[0].raw)))
  if score < threshold:
    critic = result.tasks_output[1].raw
  else:
    return ""

def gen_code(llm, section_name, section_content):
    messages = [
        SystemMessage(content="You are an assistant that converts plain text into LaTeX code for a research article. Generate appropriate code according to the text, if you find a section heading use the appropriate function, if you find subheading use their proper functions."),
        HumanMessage(content=f"""
            Section Name: {section_name}
            Section Content: {section_content}
            Provide the generated latex code for this section as output.
            Do not generate any other text for answering
            """),
    ]

    response = llm.invoke(messages).content
    return response

def spam_flag(llm, user_input):
    messages = [
        SystemMessage(content=(
            "You are a text classifier. The input text is supposed to be a suggestion feed. Analyze the input and determine if it is a spam input, "
            "random, or unrelated text. Return '1' if it is a spam input, otherwise return '0'. Return 0 also if the feed asks to proceed next or go next or okay in any means"
            "Do not add any explanation or extra text."
        )),
        HumanMessage(content=user_input)  # placeholder for input text
    ]
    response = llm.invoke(messages).content
    try:
        return int(response.strip())
    except ValueError:
        return -1

def citation_manager(llm, inp2, section):
    messages = [
        SystemMessage(content=(
            "You are a citation manager assistant. Your task is to find proper citations for the given section of a research paper. "
            "Use the provided section content to identify key references and related papers."
            "Your main and only task is to provide a list of references that is relevant to the section"
        )),
        HumanMessage(content=f"Section: {inp2[section]}")
    ]
    response = llm.invoke(messages).content
    inp2['references'][section] = response
    messages = [
        SystemMessage(content=(
            "You are a citation manager assistant. You are provided with a section of a research paper and a list of relvant citations to that. Your task is to simply apply proper citations for the given section of a research paper. "
            "Use the provided section content and add citations at necessary places."
            "Important Rule: the citations should be applied using the author name and not numbered"
            "Provide the full section text with the citations applied."
            "You are not allowed to generate other texts explaining your reasoning or explanatory text, your sole and only purpose is to generate the same content but with the addition of the citations."
            "Do not generate new content in the section"
        )),
        HumanMessage(content=f"Section: {inp2[section]}, Citations: {response}")
    ]
    response = llm.invoke(messages).content
    inp2[section] = response
    return inp2

def gen_tex(llm, inp2):
    system_prompt = (
        "You are a LaTeX formatting and academic writing expert. You transform structured research content into a clean, standards-compliant LaTeX paper. "
        "You always use proper LaTeX syntax, structure with \\section, \\subsection, and \\bibitem. "
        "You know how to follow academic formatting guidelines (e.g., IEEE/ACM) and ensure consistent layout, even if some formatting info is missing by using defaults or inferences."
    )

    user_prompt = f"""
    You are provided with structured research paper components as variables. Use only the provided variables to generate a LaTeX document.

    Variables:
    - title: {inp2.get('title', '')}
    - abstract: {inp2.get('abstract', '')}
    - authors: {inp2.get('author', '')}
    - conference/journal: {inp2.get('conf', '')}
    - keywords: {inp2.get('keywords', '')}
    - references: {inp2.get('references', '')}
    - introduction: {inp2.get('intro', '')}
    - Related Works: {inp2.get('Related_Works', '')}
    - methodology: {inp2.get('methodology', '')}
    - results: {inp2.get('results_sec', '')}
    - discussion: {inp2.get('discussion', '')}
    - conclusion: {inp2.get('conclusion', '')}

    Instructions:
    1. Do NOT add any information that is not explicitly passed in the variables.
    2. Format the paper using LaTeX with \\documentclass at the top and \\end document at the bottom.
    3. Use \\section for: Introduction, Methodology, Results, Discussion, Conclusion.
    4. Add the title using \\title, authors using \\author, and abstract using \\begin{{abstract}} ... \\end{{abstract}}.
    5. Add keywords below the abstract with a line like: \\textbf{{Keywords}}: ...
    6. Include a References section using \\begin{{thebibliography}} and format each reference using \\bibitem.
    7. Follow any formatting constraints or rules in author_guidelines to adjust the structure or documentclass.

    Final Requirement:
    Return a single valid LaTeX document as a string. Your answer MUST start with \\documentclass and end with \\end{{document}}.
    """

    messages = [
        ("system", system_prompt),
        ("user", user_prompt),
    ]

    response = llm.invoke(messages).content
    return response


def gen_guidelines(llm, inp2):
    system_prompt = (
        "You are an expert researcher assistant specialized in finding and interpreting "
        "submission requirements from academic journals and conferences."
    )

    user_prompt = f"""
    Search the web for the author submission guidelines for the journal or conference named: '{inp2.get('conf', '')}'.

    Once found, scrape the guideline content from the most reliable source (typically the official site).

    Use your search tool to find the relevant webpage and use your scraping tool to extract the content.

    Your final output MUST be a structured list of submission steps or rules, clearly formatted and concise.
    """

    messages = [
        ("system", system_prompt),
        ("user", user_prompt),
    ]

    response = llm.invoke(messages).content
    return response


async def handle_client(websocket):
    """Handle client connection"""
    client_id = f"client_{len(clients)}"
    clients[client_id] = websocket
    
    try:
        # Initial connection messages
        await send_message(websocket, "System", "Client connection established, ready to process requests", 
                          "Connected to MARAW Backbone. Running Crew...")
        
        # Collect inputs
        inputs = {}
        input_prompts = [
            ("title", "Please enter the title of the project"),
            ("conf", "Please enter the conference/journal name"),
            ("author", "Please enter the author's names and designations"),
            ("problem_statement", "Please enter the main problem statement"),
            ("proposal", "Please enter the proposed solution"),
            ("contributions", "Please enter the contribution"),
            ("results", "Please enter the expected results"),
            ("abstract", "Please enter a brief abstract"),
            ("keywords", "Please enter relevant keywords"),
            ("references", "Please enter references")
        ]
        
        for key, message in input_prompts:
            inputs[key] = await wait_for_input(websocket, "Planner", "", message)
        
        os.environ["GROQ_API_KEY"] = "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"
        os.environ["GEMINI_API_KEY"] = "AIzaSyBeOIpEcN6Z-wCC1khjjOkQBb9Sgiz9Hvc"
        os.environ["SERPER_API_KEY"] = "4709390a588f318ddbe2683e2af48074be1db0de"
        # Clean inputs
        llm_llama3_3_70B = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
            api_key=os.environ["GROQ_API_KEY"]
        )

        gemini_llm = LLM(
            model='gemini/gemini-2.0-flash',
            api_key=os.environ["GEMINI_API_KEY"],
            temperature=0.5  # Lower temperature for more consistent results.
        )
        latex_writer = Agent(
            role='LaTeX Research Writer',
            goal='Write a LaTeX research paper using structured content and formatting guidelines',
            backstory=(
                "You are a LaTeX formatting and academic writing expert. You transform structured research content into a clean, standards-compliant LaTeX paper. "
                "You always use proper LaTeX syntax, structure with \\section, \\subsection, and \\bibitem. "
                "You know how to follow academic formatting guidelines (e.g., IEEE/ACM) and ensure consistent layout, even if some formatting info is missing by using defaults or inferences."
            ),
            allow_delegation=False,
            memory=True,
            verbose=True,
            llm="groq/llama-3.3-70b-versatile",
            api_key=os.environ["GROQ_API_KEY"]
        )

        # STEP 3: Define the task
        write_latex_task = Task(
            description=(
                "You are provided with structured research paper components as variables. Use only the provided variables to generate a LaTeX document.\n\n"
                "Variables:\n"
                "- title: {title}\n"
                "- abstract: {abstract}\n"
                "- authors: {author}\n"
                "- conference/journal: {conf}\n"
                "- keywords: {keywords}\n"
                "- references: {references}\n"
                "- introduction: {intro}\n"
                "- Related Works: {Related_Works}\n"
                "- methodology: {methodology}\n"
                "- results: {results_sec}\n"
                "- discussion: {discussion}\n"
                "- conclusion: {conclusion}\n"
                "- author guidelines: {author_guidelines}\n\n"

                "Instructions:\n"
                "1. Do NOT add any information that is not explicitly passed in the variables.\n"
                "2. Format the paper using LaTeX with \\documentclass at the top and \\end document at the bottom.\n"
                "3. Use \\section for: Introduction, Methodology, Results, Discussion, Conclusion.\n"
                "4. Add the title using \\title, authors using \\author, and abstract using \\begin abstract .\n"
                "5. Add keywords below the abstract with a line like: \\textbf Keywords: ...\n"
                "6. Include a References section using \\begin thebibliography and format each reference using \\bibitem.\n"
                "7. Follow any formatting constraints or rules in `author_guidelines` to adjust the structure or documentclass.\n\n"

                "Final Requirement:\n"
                "Return a single valid LaTeX document as a string. Your answer MUST start with \\documentclass and end with \\end document ."
            ),
            expected_output="A complete LaTeX document as a string using only the provided fields, with valid LaTeX syntax from \\documentclass to \\end document ",
            agent=latex_writer
        )

        # STEP 4: Create the crew
        crew = Crew(
            agents=[latex_writer],
            tasks=[write_latex_task],
            process=Process.sequential
        )
        from crewai_tools import SerperDevTool, ScrapeWebsiteTool

        search_tool = SerperDevTool()
        scrape_tool = ScrapeWebsiteTool()

        search_agent = Agent(
            role="Search Strategist",
            goal=(
                "Use reasoning and internet search to locate the official author/submission guidelines for the given conference or journal. "
                "Refine your queries if initial attempts don't yield relevant results. Only return links from trusted sources (e.g., IEEE, ACM, Springer)."
            ),
            backstory=(
                "You are an expert researcher specializing in academic publishing. You excel at uncovering hard-to-find author instructions "
                "by using search engines intelligently. You use step-by-step logic and refine queries as needed, embracing trial-and-error if necessary."
            ),
            tools=[search_tool],
            llm=gemini_llm,
            memory=True,
            verbose=True  # Enable verbose to debug reasoning chain
        )

        scraper_agent = Agent(
            role="Guideline Extractor",
            goal=(
                "Scrape the provided URLs intelligently and extract sections that describe author formatting instructions, "
                "template types, submission rules, or style guidelines. If the scrape fails, reason about why and suggest next steps."
            ),
            backstory=(
                "You are a web scraping specialist with deep experience navigating complex HTML content. You know where formatting details "
                "are likely to live on academic sites and use reasoning to determine if you've found the right content or need to escalate."
            ),
            tools=[scrape_tool],
            memory=True,
            llm=gemini_llm,
            verbose=True
        )

        summarizer_agent = Agent(
            role="Formatting Analyst",
            goal=(
                "Analyze the extracted submission instructions and summarize them in a structured format including: "
                "Format type, Page Limit, Font, Margins, Columns, Reference Style, and any Template Download links. "
                "Infer missing fields using context when possible, and clearly state unknowns."
            ),
            backstory=(
                "You are a formatting rules analyst who specializes in decoding conference/journal guidelines. "
                "You understand IEEE, ACM, Springer, and other major styles, and can infer formatting norms when needed."
            ),
            memory=True,
            verbose=True,
            llm=gemini_llm
        )

        # ----------------------------------------------------

        search_task = Task(
        description=(
            "Your goal is to find the official author/submission guidelines page for the specified conference or journal: {conf}. "
            "Use a search engine and think step-by-step. Consider different search phrases (e.g., 'submission guidelines', 'author instructions', 'paper formatting'). "
            "If you do not find useful results, refine your search terms and try again. "
            "Only return links that contain official information from the conference/journal website or a trusted publisher (e.g., IEEE, Springer)."
        ),
        expected_output="A list of 1–3 high-quality, official URLs with submission/formatting guidelines.",
        agent=search_agent
        )

        scrape_task = Task(
        description=(
            "Take the URLs provided and attempt to scrape their content. First, examine whether the page includes keywords like 'LaTeX', 'template', 'formatting', 'submission', or 'page limit'. "
            "If the content lacks these, consider it a failed scrape. In such cases, suggest to the team that a better link may be needed. "
            "Extract full sections if available, especially anything under headings like 'Instructions for Authors', 'Submission Format', or 'Paper Template'."
        ),
        expected_output="Raw HTML or cleaned text that clearly mentions author guidelines, templates, or submission requirements.",
        agent=scraper_agent,
        context=[search_task]
        )

        summarize_task = Task(
        description=(
            "Review the extracted content. Reflect on whether the text provides enough detail for each of these fields: "
            "Format (LaTeX/Word), Page Limit, Font, Margin, Reference Style, Columns, Template Download Links. "
            "If details are vague, infer based on context (e.g., IEEE-style usually implies two-column format). Be honest about missing fields. "
            "Present the summary in a bullet list with field names as keys."
        ),
        expected_output="A structured summary of the submission guidelines with inferred or confirmed values for each formatting field.",
        agent=summarizer_agent,
        context=[scrape_task]
        )

        # ----------------------------------------------------

        crew1 = Crew(
        agents=[search_agent, scraper_agent, summarizer_agent],
        tasks=[search_task, scrape_task, summarize_task],
        process=Process.sequential
        )

        

        
        recurssion_depth=2
        inp2 = clean_inputs(llm_llama3_3_70B, inputs)
        # Abstract
        # result = crew1.kickoff(inputs={'conf': inp2['conf']})
        inp2["author_guidelines"] = gen_guidelines(llm_llama3_3_70B, inp2)


        abstract = gen_abstract(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", "Abstract: "+abstract)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            abstract = gen_abstract(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Abstract: "+abstract)
        inp2['abstract'] = abstract

        # Title
        title = gen_title(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", "Title: "+title)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            title = gen_title(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Title: "+title)
        inp2['title'] = title

        # Introduction
        intro = gen_intro(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", "Introduction: "+intro)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            intro = gen_intro(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Introduction: "+intro)
        inp2['intro'] = intro

        # Keywords
        keywords = gen_keywords(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", "Keywords: "+keywords)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            keywords = gen_keywords(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Keywords: "+keywords)
        inp2['keywords'] = keywords

        literature = gen_related_work(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", "Literature Review: "+literature)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            literature = gen_related_work(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Literature Review: "+literature)
        inp2['Related_Works'] = literature

        # Methodology Plan
        methodology_plan = gen_methodology_plan(llm_llama3_3_70B, inp2)
        inp2['meth_plan'] = methodology_plan

        # Methodology
        methodology = gen_methodology(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", methodology_plan, 'Methodology: '+methodology)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            methodology = gen_methodology(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Methodology: "+methodology)
        inp2['methodology'] = methodology

        # Results
        results = gen_results(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", 'Results: '+results)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            results = gen_results(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Results: "+results)
        inp2['results_sec'] = results

        # Discussion
        discussion = gen_discussion(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", 'Discussion: '+discussion)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            discussion = gen_discussion(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Discussion: "+discussion)
        inp2['discussion'] = discussion

        # Conclusion
        conclusion = gen_conclusion(llm_llama3_3_70B, inp2)
        critic = await wait_for_input(websocket, "Content Generator", "", 'Conclusion: '+conclusion)
        i=0
        while critic != "next" and i<recurssion_depth:
            i+=1
            conclusion = gen_conclusion(llm_llama3_3_70B, inp2, critic)
            critic = await wait_for_input(websocket, "Critic", "", "Conclusion: "+conclusion)
        inp2['conclusion'] = conclusion
        
        inp2['conclusion'] = conclusion
        inp2['references'] = {}
        for section in inp2.keys():
            if section in ['results_sec', 'methodology', 'intro', 'discussion', 'conclusion', 'Related_Works']:
                inp2 = citation_manager(llm_llama3_3_70B, inp2, section)


        # result = crew.kickoff(inputs=inp2)
        # latex_content=result.tasks_output[0].raw
        latex_content = gen_tex(llm_llama3_3_70B, inp2)
        output_dir = tempfile.mkdtemp()
        tex_file_path = os.path.join(output_dir, f"{inp2.get('title', 'paper').replace(' ', '_')}.tex")
        
        # Save LaTeX file
        with open(tex_file_path, 'w', encoding='utf-8') as f:
            f.write(latex_content)
        user_request = await wait_for_input(websocket, "Code Formatter", "", "Successfully generated LaTex Code. File ready for download, Enter 'download-tex' to download the file and 'download-pdf' to download the pdf")

        if user_request.lower() == 'download-tex':
            await send_message(websocket, "System", "Sending LaTeX file", "📤 Sending LaTeX file...")
            success = await send_file(websocket, tex_file_path, "tex")
            if success:
                await send_message(websocket, "System", "File sent", "✅ LaTeX file sent successfully!")
                
        elif user_request.lower() == 'download-pdf':
            await send_message(websocket, "System", "Compiling PDF", "🔄 Compiling LaTeX to PDF...")
            pdf_path = compile_latex_to_pdf(latex_content, output_dir)
            
            if pdf_path:
                await send_message(websocket, "System", "Sending PDF file", "📤 Sending PDF file...")
                success = await send_file(websocket, pdf_path, "pdf")
                if success:
                    await send_message(websocket, "System", "PDF sent", "✅ PDF file sent successfully!")

    except websockets.exceptions.ConnectionClosed:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await send_message(websocket, "System", "Error occurred", f"❌ Error: {str(e)}")
    finally:
        if client_id in clients:
            del clients[client_id]

async def start_server():
    """Start the WebSocket server"""
    print("Starting MARAW server on localhost:8765")
    async with websockets.serve(handle_client, "localhost", 8765):
        print("Server running... Press Ctrl+C to stop")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\nServer stopped")