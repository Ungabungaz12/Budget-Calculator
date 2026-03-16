
// Using async/await to fetch data and parse JSON
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
}

fetchData();

//Calculate the taxes
function calculateFederalTax() {
    const deduction = 16100;
    let taxableIncome = selectValue - deduction;

    if (taxableIncome <= 0) {
        return 0;
    }

    let tax = 0;

    if (taxableIncome <= 12400) {
        // Entirely in the 10% bracket
        tax = taxableIncome * 0.10;
    } else if (taxableIncome <= 50400) {
        // 10% on the first $12,400 + 12% on the amount ABOVE that
        tax = (12400 * 0.10) + ((taxableIncome - 12400) * 0.12);
    } else {
        // 10% on the first $12,400 + 12% on the next $38,000 + 22% on the rest
        tax = (12400 * 0.10) + (38000 * 0.12) + ((taxableIncome - 50400) * 0.22);
    }

    return tax;
}

// Get the value of the select element and update it when the user changes the selection

let selectValue = document.querySelector('select').value / 12; // Get the value of the select element
function updateValue() {
    selectValue = document.querySelector('select').value / 12; // Update the value of the select element
    update(); // Call the update function to update the chart
}


// Get all the input elements and store them in an array
const [...sections] = document.querySelectorAll("section");
const all_inputs = sections.map((section) => section.querySelectorAll("input"));

/**
 * @param {NodeListOf<HTMLInputElement>} inputs
 */
function sum(inputs) {
  return selectValue - [...inputs].reduce((a, b) => a + b.valueAsNumber, 0);
}


// Get the sum of all the input values, treating NaN as 0
function getSum() {
    let sum = 0;
    all_inputs.forEach(inputs => {
        inputs.forEach(input => {
            sum += input.valueAsNumber || 0; // Treat NaN as 0
        });
    });
    return sum;
}


function goodorBad() {
    const remaining = selectValue - (selectValue * 0.0145) - (selectValue * 0.062) - (selectValue * 0.05) - calculateFederalTax() - getSum();
    if (remaining > 0) {
        return '#00FF00';
    } else if (remaining === 0) {
        return '#FFF';
    } else {
        return '#FF0000';
    }
}
function positiveOrNegative() {
    const remaining = selectValue - (selectValue * 0.0145) - (selectValue * 0.062) - (selectValue * 0.05) - calculateFederalTax() - getSum();
    if (remaining > 0) {
        return `$${remaining.toFixed(2)}`;
    } else if (remaining === 0) {
        return `$${remaining.toFixed(2)}`;
    } else {
        return `-$${Math.abs(remaining).toFixed(2)}`;
    }
}



// Register the plugin for Chart.JS
const image = document.getElementById("coins");
const centerTextPlugin = {
    id: 'centerText',
    afterDatasetsDraw(chart, args, options) {
      const { ctx, chartArea: { left, right, top, bottom } } = chart;
      ctx.save();
      
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      const totalValue = options.totalValue || 'N/A';
      const valueColor = options.color || '#FFF'; 
      const labelColor = '#FFF'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "24px 'Open Sans'"; 
      ctx.fillStyle = valueColor; 
      ctx.fillText(totalValue, centerX, centerY);
      ctx.font = "16px 'Open Sans'"; 
      ctx.fillStyle = labelColor; 
      ctx.fillText("Avaliable Budget", centerX, centerY + 25);
      ctx.drawImage(image, centerX - 20, centerY - 55, 40, 40);
      ctx.restore();
    }
};
Chart.register(centerTextPlugin);  

const canvas = document.querySelector("canvas");
let current_chart = null;

function update() {
    current_chart?.destroy();
    current_chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Medicare', 'Social Security', 'State Tax', 'Federal Tax', 'Education', 'Housing', `Essentials`, `Lifestyle`, `Savings`],
            datasets: [
                {
                    label: 'Monthly (USD)',
                    data: [
                        selectValue,
                        selectValue * 0.0145,
                        selectValue * 0.062,
                        selectValue * 0.05,
                        calculateFederalTax(),
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


                      ],
                }
            ]
        },
        options: {
            responsive: false,
            elements: {
                arc: {
                    borderWidth: 0
                }
            },
            cutout: '60%',
            plugins: {
                centerText: {
                    totalValue: positiveOrNegative(),
                    color: goodorBad() 
                  },
                legend: {
                    display: false
                }
            }
        }
    });

}

document.body.addEventListener('input', () => {
    update();
});

update();


function popUp() {
    const incomePercent = selectValue - ((selectValue * 0.0145) - (selectValue * 0.062) - (selectValue * 0.05) - calculateFederalTax() - getSum());
    const savings = document.getElementById("savings").valueAsNumber || 0;
    const results = document.getElementById("results");
    if (savings < incomePercent * 0.1) {
        const popup = document.createElement("div");
        popup.classList.add("popup");
        popup.innerHTML = `
            <h2>Wise-up!</h2>
            <p>"Savings" is an expense you pay to your future self.</p>
            <p>Consider saving at least 10% of your monthly earnings!</p>
            <button id="close-btn">OK</button>
        `;
        popup.style.fontFamily = "'Open Sans', sans-serif";
        results.appendChild(popup);
        document.getElementById("close-btn").addEventListener("click", () => {
            results.removeChild(popup);
        });

    } else {
        return;
    }
}

