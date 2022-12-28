import { NeuralLayer } from "./layer";

export class NeuralNetwork {
    inputLayer: NeuralLayer;
    hiddenLayer: NeuralLayer;
    hiddenLayer2: NeuralLayer;
    outputLayer: NeuralLayer;

    score: number;
    weights: number[][][] = [];
    biases: number[][] = []

    constructor() {
        let inputSize = 5; 
        let hiddenSize = 60;
        let outputSize = 3;
        this.inputLayer = new NeuralLayer(inputSize,hiddenSize);
        this.hiddenLayer = new NeuralLayer(hiddenSize,hiddenSize);
        this.hiddenLayer2 = new NeuralLayer(hiddenSize,hiddenSize);
        this.outputLayer = new NeuralLayer(hiddenSize,outputSize);
        this.score = 0;
    }

    public getWeights() {
        this.weights = []
        this.weights.push(this.inputLayer.weights)
        this.weights.push(this.hiddenLayer.weights)
        this.weights.push(this.hiddenLayer2.weights)
        this.weights.push(this.outputLayer.weights)
        return this.weights;
    }

    public getBiases() {
        this.biases = []
        this.biases.push(this.inputLayer.biases)
        this.biases.push(this.hiddenLayer.biases)
        this.biases.push(this.hiddenLayer2.biases)
        this.biases.push(this.outputLayer.biases)
        return this.biases;
    }

    public updateWeights(weights: number[][][]) {
        this.inputLayer.weights = weights[0]
        this.hiddenLayer.weights = weights[1]
        this.hiddenLayer2.weights = weights[2]
        this.outputLayer.weights = weights[3]
    }
    
    public updateBiases(biases: number[][]) {
        this.inputLayer.biases = biases[0]
        this.hiddenLayer.biases = biases[1]
        this.hiddenLayer2.biases = biases[2]
        this.outputLayer.biases = biases[3]
    }

    public logWeightAndBias(){
        console.log("INPUT LAYER: W: " +this.inputLayer.weights[0][0] + " B: " +  this.inputLayer.biases[0])
        console.log("HIDDEN LAYER: W: " +this.hiddenLayer.weights[0][0] + " B: " +  this.hiddenLayer.biases[0])
        console.log("HIDDEN 2 LAYER: W: " +this.hiddenLayer2.weights[0][0] + " B: " +  this.hiddenLayer2.biases[0])
        console.log("OUTPUT LAYER: W: " +this.outputLayer.weights[0][0] + " B: " +  this.outputLayer.biases[0])
    }
}
