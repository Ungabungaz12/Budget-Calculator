let finaltaxes = 0;
let selectValue = 0;
let selectYearly = 0;

// Fetch data and populate dropdown
async function fetchData() {
    const response = await fetch("https://eecu-data-server.vercel.app/data");
    const data = await response.json();
    const select = document.querySelector("select");

    data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.Salary;
        option.textContent = item.Occupation;
        select.appendChild(option);
    });

    // Set initial values AFTER data loads
    updateValue();
}

fetchData();

// Update values when selection changes
function updateValue() {
    const selectEl = document.querySelector('select');

    selectValue = Number(selectEl.value) / 12;
    selectYearly = Number(selectEl.value);

    // ✅ FIX: recalculate taxes every time
    finaltaxes = calculateFederalTax() / 12;

    update();
}

// Listen for dropdown changes
document.querySelector('select').addEventListener('change', updateValue);

// Federal tax calculation
function calculateFederalTax() {
    const deduction = 16100;
    let taxableIncome = selectYearly - deduction;

    if (taxableIncome <= 0) return 0;

    let tax = 0;

    if (taxableIncome <= 12400) {
        tax = taxableIncome * 0.10;
    } else if (taxableIncome <= 50400) {
        tax = (12400 * 0.10) + ((taxableIncome - 12400) * 0.12);
    } else {
        tax = (12400 * 0.10) + (38000 * 0.12) + ((taxableIncome - 50400) * 0.22);
    }

    return tax;
}

// Inputs
const [...sections] = document.querySelectorAll("section");
const all_inputs = sections.map(section => section.querySelectorAll("input"));

function sum(inputs) {
    return selectValue - [...inputs].reduce((a, b) => a + (b.valueAsNumber || 0), 0);
}

function getSum() {
    let sum = 0;
    all_inputs.forEach(inputs => {
        inputs.forEach(input => {
            sum += input.valueAsNumber || 0;
        });
    });
    return sum;
}

// Budget color
function goodorBad() {
    const remaining = selectValue
        - (selectValue * 0.0145)
        - (selectValue * 0.062)
        - (selectValue * 0.05)
        - finaltaxes
        - getSum();

    if (remaining > 0) return '#00FF00';
    if (remaining === 0) return '#FFF';
    return '#FF0000';
}

// Budget text
function positiveOrNegative() {
    const remaining = selectValue
        - (selectValue * 0.0145)
        - (selectValue * 0.062)
        - (selectValue * 0.05)
        - finaltaxes
        - getSum();

    if (remaining >= 0) {
        return `$${remaining.toFixed(2)}`;
    } else {
        return `-$${Math.abs(remaining).toFixed(2)}`;
    }
}

// Chart plugin
const image = document.getElementById("coins");

const centerTextPlugin = {
    id: 'centerText',
    afterDatasetsDraw(chart, args, options) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;

        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = "24px 'Open Sans'";
        ctx.fillStyle = options.color || '#FFF';
        ctx.fillText(options.totalValue || 'N/A', centerX, centerY);

        ctx.font = "16px 'Open Sans'";
        ctx.fillStyle = '#FFF';
        ctx.fillText("Available Budget", centerX, centerY + 25);

        ctx.drawImage(image, centerX - 20, centerY - 55, 40, 40);
        ctx.restore();
    }
};

Chart.register(centerTextPlugin);

const canvas = document.querySelector("canvas");
let current_chart = null;

// Chart update
function update() {
    current_chart?.destroy();

    current_chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: [
                'Income',
                'Medicare',
                'Social Security',
                'State Tax',
                'Federal Tax',
                'Education',
                'Housing',
                'Essentials',
                'Lifestyle',
                'Savings'
            ],
            datasets: [{
                label: 'Monthly (USD)',
                data: [
                    selectValue,
                    selectValue * 0.0145,
                    selectValue * 0.062,
                    selectValue * 0.05,
                    finaltaxes,
                    selectValue - sum(all_inputs[0]),
                    selectValue - sum(all_inputs[1]),
                    selectValue - sum(all_inputs[2]),
                    selectValue - sum(all_inputs[3]),
                    selectValue - sum(all_inputs[4])
                ],
                backgroundColor: [
                    'rgb(54, 54, 255)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(201, 203, 207)',
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)'
                ]
            }]
        },
        options: {
            responsive: false,
            elements: {
                arc: { borderWidth: 0 }
            },
            cutout: '60%',
            plugins: {
                centerText: {
                    totalValue: positiveOrNegative(),
                    color: goodorBad()
                },
                legend: { display: false }
            }
        }
    });
}

// Update on input
document.body.addEventListener('input', update);

// Popup warning
function popUp() {
    const incomePercent = selectValue
        - (selectValue * 0.0145)
        - (selectValue * 0.062)
        - (selectValue * 0.05)
        - finaltaxes
        - getSum();

    const savings = document.getElementById("savings").valueAsNumber || 0;
    const results = document.getElementById("results");

    if (savings < incomePercent * 0.1) {
        if (results.querySelector(".popup")) return;

        const popup = document.createElement("div");
        popup.classList.add("popup");
        popup.innerHTML = `
            <h2>Wise-up!</h2>
            <p>"Savings" is an expense you pay to your future self.</p>
            <p>Consider saving at least 10% of your monthly earnings!</p>
            <button id="close-btn">OK</button>
        `;

        results.appendChild(popup);

        document.getElementById("close-btn").addEventListener("click", () => {
            results.removeChild(popup);
        });
    }
}