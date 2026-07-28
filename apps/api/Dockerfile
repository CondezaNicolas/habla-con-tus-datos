FROM cgr.dev/chainguard/python:latest-dev@sha256:3be081f6cae8f1678609f6ae00b1dfebd6819c3ce75b7c574663af84afe99cc4 AS builder

USER root
WORKDIR /build
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir . \
    && pip uninstall --yes pip setuptools wheel

FROM cgr.dev/chainguard/python:latest@sha256:b3d3fbb8b9fe48950bab73d49bffa7496ff6f8a46ba570b302fc366f1396011a

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH"

WORKDIR /app
COPY --from=builder /venv /venv
COPY app ./app

USER nonroot
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]
ENTRYPOINT ["/venv/bin/python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
