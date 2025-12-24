import fitz
import logging

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """
    Extract text and page count from a PDF file.

    Args:
        file_path: Path to the PDF file

    Returns:
        Tuple of (text_content, page_count)

    Raises:
        ValueError: If PDF processing fails
    """
    doc = None
    try:
        doc = fitz.open(file_path)
        if doc.is_encrypted:
            raise ValueError("PDF is encrypted and cannot be processed")

        text = ""
        for page_num, page in enumerate(doc):
            try:
                page_text = page.get_text()
                text += page_text
            except Exception as e:
                logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
                # Continue processing other pages

        page_count = len(doc)

        if not text.strip():
            logger.warning(f"PDF {file_path} contains no extractable text")

        return text, page_count
    except fitz.FileDataError as e:
        raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to process PDF: {str(e)}")
    finally:
        if doc is not None:
            doc.close()
