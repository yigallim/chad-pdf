MOCK_RESPONSE = """
Absolutely! I support **rich Markdown output** including:

* ✅ Tables
* ✅ Math equations (LaTeX-style, rendered with KaTeX)
* ✅ Code blocks with syntax highlighting
* ✅ Lists (ordered/unordered)
* ✅ Images (with proper links)
* ✅ Blockquotes
* ✅ Headings and inline formatting (bold, *italic*, `monospace`, etc.)

---

### 🧮 Example: Math Equation (Backpropagation Gradient)

Here's a simple weight update equation in backpropagation:

$$
w \\leftarrow w - \\eta \\frac{\\partial L}{\\partial w}
$$

Where:

| Symbol                          | Meaning                                    |
| ------------------------------- | ------------------------------------------ |
| $w$                             | Weight of the neuron                       |
| $\\eta$                          | Learning rate                              |
| $\\frac{\\partial L}{\\partial w}$ | Gradient of the loss $L$ w\\.r.t weight $w$ |

---

### 📋 Example: Syntax-highlighted Code (Python)

```python
def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# Derivative of loss with respect to weight
gradient = dL_da * da_dz * dz_dw
```

---

### 🔢 Table Example: Activation Comparisons

| Input $z$ | Sigmoid $\\sigma(z)$ | Tanh $\\tanh(z)$ |
| --------- | ------------------- | --------------- |
| -2        | 0.119               | -0.964          |
| 0         | 0.5                 | 0               |
| 2         | 0.881               | 0.964           |

---

### 📦 Blockquote

> “In theory, theory and practice are the same. In practice, they are not.”
> — *Albert Einstein*

---

Let me know what you'd like me to format next — text, math, code, or diagrams?
"""
