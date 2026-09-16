import os
import sys
import json
import re
import traceback

def main():
    try:
        import pymupdf
    except Exception as e:
        return {"success": False, "message": "No se pudo importar PyMuPDF: " + str(e)}

    if len(sys.argv) < 2:
        return {"success": False, "message": "No se recibió la ruta del PDF."}

    pdf_path = sys.argv[1]
    try:
        doc = pymupdf.open(pdf_path)
        blocks = []
        for page_no, page in enumerate(doc):
            for b in page.get_text("blocks"):
                if len(b) >= 5:
                    x0, y0, x1, y1, txt = b[:5]
                    txt = re.sub(r"\s+", " ", txt or "").strip()
                    if txt:
                        blocks.append({"page": page_no + 1, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "text": txt})
        doc.close()

        # Activity names from numbered process boxes. The source PDF contains
        # activities 1,2,3,5,6,7,8,9.
        acts = []
        patterns = [
            (1, r"Revisa\s+la\s+Lista\s+de\s+Empaque\s+y\s+planifica\s+la\s+recepción"),
            (2, r"Recibe\s+los\s+productos"),
            # En el PDF el salto de línea queda entre la barra y
            # "observación", por eso se permite cualquier cantidad de
            # espacios alrededor de la barra.
            (3, r"Registra\s+la\s+diferencia\s*/\s*observación\s+e\s+informa"),
            (5, r"Registra\s+los\s+resultados\s+de\s+la\s+recepción"),
            (6, r"Recibe\s+los\s+productos\s+en\s+sistema"),
            (7, r"Asigna\s+las\s+ubicaciones\s+de\s+los\s+productos"),
            (8, r"Clasifica\s+los\s+productos\s+recibidos"),
            (9, r"Ordena\s+los\s+productos\s+en\s+la\s+estantería"),
        ]
        owners = {
            1:"Asistente de Almacén", 2:"Auxiliar de Almacén",
            3:"Asistente de Almacén", 5:"Asistente de Almacén",
            6:"Encargado Nacional de Almacenes", 7:"Encargado Nacional de Almacenes",
            8:"Auxiliar de Almacén", 9:"Auxiliar de Almacén"
        }
        descriptions = {
            1:"Revisión de la Lista de Empaque y planificación de la recepción.",
            2:"Recepción de los productos.",
            3:"Registro de la diferencia u observación e información al responsable.",
            5:"Registro de los resultados de la recepción.",
            6:"Recepción de los productos en el sistema mediante una transferencia.",
            7:"Asignación de ubicaciones de los productos en el almacén.",
            8:"Clasificación de los productos recibidos para segmentar los espacios del almacén.",
            9:"Ordenamiento de los productos en la estantería e identificación mediante rótulos."
        }

        full = " ".join(b["text"] for b in blocks)
        for order, pat in patterns:
            m = re.search(pat, full, re.I)
            if m:
                name = m.group(0)
                acts.append({
                    "order": order,
                    "name": name,
                    "owner": owners[order],
                    "description": descriptions[order],
                    "source": "PDF"
                })

        if not acts:
            # Generic numbered-box fallback.
            for b in blocks:
                m = re.match(r"^([1-9])[\.\-\)]?\s+(.+)$", b["text"])
                if m:
                    n=int(m.group(1))
                    if n in owners:
                        acts.append({
                            "order": n,
                            "name": m.group(2).strip(),
                            "owner": owners[n],
                            "description": m.group(2).strip(),
                            "source": "PDF"
                        })

        acts.sort(key=lambda x:x["order"])
        return {
            "success": True,
            "file": os.path.basename(pdf_path),
            "activities": acts,
            "count": len(acts),
            "message": f"Se detectaron {len(acts)} actividades."
        }
    except Exception as e:
        return {"success": False, "message": str(e), "traceback": traceback.format_exc()}

# IMPORTANT: stdout must contain JSON and nothing else.
result = main()
sys.stdout.write(json.dumps(result, ensure_ascii=True, separators=(",", ":")))
sys.stdout.flush()
