export class NeuralLayer {
    weights: number[][];
    biases: number[];
    numInputs: number
    numOutputs: number

    constructor(numInputs: number, numOutputs: number) {
        this.weights = [];
        this.biases = [];

        // initialize weights and biases with random values
        for (let i = 0; i < numOutputs; i++) {
            this.weights[i] = [];
            this.biases[i] = Math.floor(Math.random()*199) - 99;
            for (let j = 0; j < numInputs; j++) {
                this.weights[i][j] = Math.random();
            }
        }
    }

    forward(inputs: number[]): number[] {
        // apply weights and biases to the inputs
        let outputs: number[] = [];
        for (let i = 0; i < this.weights.length; i++) {
            let output = this.biases[i];
            for (let j = 0; j < inputs.length; j++) {
                output += inputs[j] * this.weights[i][j];
            }
            outputs.push(output);
        }
        // apply activation Function:
        outputs = this.activationFunction(outputs);        
        return outputs;
    }

    activationFunction(outputs: number[]) {
        return outputs.map(this.sigmoid)
    }

    sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    logInfo() {
        console.log("OVERVIEW: ")
        console.log(this.weights)
        console.log(this.biases)
    }
}
