import { PlayerController } from "../components/PlayerController";
import { IScore } from "../components/State";
import { Data } from "./modeldata/data";
import { NeuralNetwork } from "./neuralNetwork";

export class AI {
    // define population parameters
    populationSize = 50;
    population: NeuralNetwork[];
    lastPopulation: NeuralNetwork[];

    // initialize variables for counters
    currentModel = 0;
    currentGeneration = 0;
    bestResult = 0;

    // Initialize input variables for AI
    frame: number;
    presents: number;
    trickScore: number;
    angle: number
    angleVelocity: number
    timeInAir: number
    xPos: number
    yPos: number

    // PlayerController has all relevant Game data
    lastPlayerController: PlayerController;

    constructor() {
        // Initialize values in constructor. Maybe not necessary?
        this.population = [];
        this.lastPopulation = []

        this.frame = 0
        this.presents = 1;
        this.trickScore = 1;
        this.angle = 0;
        this.angleVelocity = 0;

        // TO PRELOAD DATA: UNCOMMENT THIS (and comment out line 46)
        var dataSet = prompt('Please enter "data" to preload trained population or leave empty for new Networks') || "none";
        // create first population (load from json)
        this.createNextPopulation(dataSet)
        // this.createNextPopulation()
    }



    feedForwardNet() {
        let input = [this.angle, this.angleVelocity, this.xPos, this.yPos, this.timeInAir]
        let o1 = this.population[this.currentModel].inputLayer.forward(input)
        let o2 = this.population[this.currentModel].hiddenLayer.forward(o1)
        let o3 = this.population[this.currentModel].hiddenLayer2.forward(o2)
        let o4 = this.population[this.currentModel].outputLayer.forward(o3)
        return o4
    }


    update(playerController: PlayerController, delta: number, standStill: number) {

        const score: IScore = playerController.state.getCurrentScore()
        // Update the Inputs every frame
        // TODO: Info about the level as input?
        this.frame += 1;
        this.presents = score.coins
        this.trickScore = score.trickScore
        this.xPos = playerController.parts.body.GetPosition().x;
        this.yPos = playerController.parts.body.GetPosition().y;
        this.angle = playerController.parts.body.GetAngle() || 0
        this.angleVelocity = playerController.parts.body.GetAngularVelocity()
        this.timeInAir = playerController.board.getTimeInAir()

        var newScore = ((this.presents * 30) + (this.trickScore) + (this.xPos * 2) + 1);
        // HANDLE CRASHING OR STANDING STILL FOR A LONG TIME
        if (playerController.state.isCrashed || standStill > 599) {
            console.log("_________________________________________")
            playerController.state.isCrashed ? console.log("CRASHED: " + (this.currentModel + 1) + " OF " + this.populationSize) : console.log("STOOD STILL TOO LONG: " + (this.currentModel + 1) + " OF " + this.populationSize);
            console.log("THIS ONE DIED WITH POINTS: " + newScore);
            console.log("LAST TIME HE HAD: " + this.population[this.currentModel].score)
            console.log("PRESENTS: " + this.presents);
            console.log("DISTANCE: " + this.xPos);
            console.log("TRICKSCORE: " + this.trickScore);
            this.population[this.currentModel].logWeightAndBias()
            if (this.currentModel + 1 >= this.populationSize) {
                console.log("CREATE NEW POPULATION")
                this.lastPopulation.push(this.population[this.currentModel])
                this.createNextPopulation();
                return
            } else {
                if (newScore > this.bestResult) {
                    console.log("NEW BEST!! : " + newScore + " BETTER THAN: " + this.bestResult);
                    this.bestResult = newScore
                }
                // UPDATE SCORE AND ADD IT TO LAST POPULATION
                this.population[this.currentModel].score = newScore;
                this.lastPopulation.push(this.population[this.currentModel])
                this.currentModel += 1
            }
            return
        }
        // Return if finished
        if (playerController.state.levelFinished) {
            console.log("JUHEE WE DID IT!")
            newScore += 50000
            this.population[this.currentModel].score = newScore;
            this.lastPopulation.push(this.population[this.currentModel])
            return
        }

        const output = this.feedForwardNet()
        // Do what the network says...
        if (output[0] > 0.5) {
            //console.log("BACKWARDS!!")
            playerController.leanBackward(delta)
            playerController.leanCenter(delta)
        }
        if (output[1] > 0.5) {
            //console.log("JUMP!!")
            playerController.jump(delta)
        }
        if (output[2] > 0.5) {
            //console.log("FORWARD!!")
            playerController.leanForward(delta)
            playerController.leanCenter(delta)
        }
        /*if (output[3] > 0.5) {
            //console.log("CENTER!!")
            playerController.leanCenter(delta)
        }*/
        return
    }


    createNextPopulation(dataSet?: string) {

        // Update Generation Counter and log information
        this.currentGeneration += 1;
        console.log("________________________")
        console.log("GENERATION: " + this.currentGeneration)

        let nextPopulation: NeuralNetwork[] = []

        // If there is no Population from a last run, see if something should be loaded
        // TODO: load and save from database?
        // Currently I save the console log in a json file to save data
        if (this.lastPopulation.length == 0) {
            if (dataSet && dataSet != "none") {

                console.log("Loading Dataset")
                const d = new Data().array

                for (let i = 0; i < this.populationSize; i++) {
                    // First element in Array are the Weights, Second are the Biases
                    if (d[0][i] != undefined) {
                        const nNetwork = new NeuralNetwork()
                        nNetwork.updateWeights(d[0][i] as number[][][])
                        nNetwork.updateBiases(d[1][i] as number[][])
                        console.log("LOADING IN DATA FOR AI NR:" + (i + 1))
                        nextPopulation.push(nNetwork);
                    } else {
                        console.log("RANDOM DATA FOR AI NR: " + (i + 1));
                        nextPopulation.push(new NeuralNetwork());
                    }
                }

            } else {
                for (let i = 0; i < this.populationSize; i++) {
                    nextPopulation.push(new NeuralNetwork());
                }
            }

        } else {
            // GET THE BEST FEW FROM LAST POPULATION!
            this.lastPopulation.sort((a, b) => b.score - a.score);
            console.log("BEST SCORE OF RUN::  " + this.bestResult)
            console.log("BEST SCORE OF POPULATION:: " + this.lastPopulation[0].score)
            console.log("WORST SCORE OF POPULATION::  " + this.lastPopulation[this.populationSize - 2].score)

            for (let i = 0; i < this.populationSize; i++) {
                if (i < this.populationSize * 0.1) {
                    // FIRST FIVE ARE THE BEST FROM LAST GENERATION
                    nextPopulation.push(this.lastPopulation[i]);
                    console.log("POS: " + i + " ADDED TOPSCORER: " + this.lastPopulation[i].score)
                } else if (i < this.populationSize * 0.6) {
                    // THEN MUTATE ONE OF THE BEST ONES
                    const selected = Math.floor(Math.random() * i * 0.1)
                    const mutatedNetwork = this.mutateNetwork(this.lastPopulation[selected])
                    console.log("POS: " + i + " MUTATED " + selected + " WITH SCORE: " + this.lastPopulation[selected].score)
                    nextPopulation.push(mutatedNetwork);
                   
                } else if (i < this.populationSize * 0.95) {
                    // Select one of the top five as a parent 1
                    const par1 = Math.floor(Math.random() * this.populationSize * 0.1)
                    // To make sure it is not the same, select the next one
                    const par2 = par1 + 1
                    console.log("POS: " + i + " OFFSPRING FROM: " + par1 + " SCORE: " + this.lastPopulation[par1].score + " AND " + par2 + " SCORE: " + this.lastPopulation[par2].score)

                    this.createOffspring(this.lastPopulation[par1], this.lastPopulation[par2])
                    nextPopulation.push(new NeuralNetwork());
                } else {
                    // Add a few completely random ones
                    console.log("POS: " + i + "ADDED COMPLETELY RANDOM")
                    nextPopulation.push(new NeuralNetwork());
                }
            }
        }
        this.population = nextPopulation;
        this.currentModel = 0;
        console.log("CREATED NEXT POPULATION")
        this.saveGeneration();
    }

    saveGeneration() {
        if (this.lastPopulation.length == 0) return
        this.lastPopulation.sort((a, b) => b.score - a.score);
        console.log("COPY THIS TO SAVE THE LAST GENERATION!!!")
        const weightsToSave: number[][][][] = []
        const biasesToSave: number[][][] = []
        for (let i = 0; i < this.populationSize / 2; i++) {
            const w = this.lastPopulation[i].getWeights()
            const b = this.lastPopulation[i].getBiases()
            weightsToSave.push(w)
            biasesToSave.push(b)
        }
        console.log(JSON.stringify([weightsToSave, biasesToSave]));
    }


    // Define a function to Mutate a Network
    mutateNetwork(network: NeuralNetwork) {
        const mutationRate = 0;
        let mutantNetwork = new NeuralNetwork()
        // Update all Weights with a Factor between 0 and 1
        const newWeights: number[][][] = JSON.parse(JSON.stringify(network.getWeights())); ;
        for (let i = 0; i < newWeights.length; i++) {
            for (let j = 0; j < newWeights[i].length; j++) {
                for (let k = 0; k < newWeights[i][j].length; k++) {
                    if (Math.random() > mutationRate) {
                        console.log("MUTATING " +  newWeights[i][j][k])
                        newWeights[i][j][k] = Math.random() * newWeights[i][j][k];
                        console.log("AFTER MUTATION " +  newWeights[i][j][k])
                    }
                }
            }
        }
        mutantNetwork.updateWeights(newWeights);
        
        // Update all Biases with a Factor between 0 and 1
        const newBiases: number[][] = JSON.parse(JSON.stringify(network.getBiases()));
        for (let i = 0; i < newBiases.length; i++) {
            for (let j = 0; j < newBiases[i].length; j++) {
                if (Math.random() > mutationRate) {
                    newBiases[i][j] = Math.random() * newBiases[i][j];
                }
            }
        }
        mutantNetwork.updateBiases(newBiases);
        return mutantNetwork
    }

    // Define a function for creating offspring from two parent individuals
    createOffspring(parent1: NeuralNetwork, parent2: NeuralNetwork): NeuralNetwork {
        const offspringNeuralNetwork = new NeuralNetwork();
        // Make copies of the parents weights and biases
        const par1Biases: number[][] = JSON.parse(JSON.stringify(parent1.getBiases()));
        const par2Biases: number[][] = JSON.parse(JSON.stringify(parent2.getBiases()));
        const par1Weights: number[][][] = JSON.parse(JSON.stringify(parent1.getWeights()));
        const par2Weights: number[][][] = JSON.parse(JSON.stringify(parent2.getWeights()));
        const newWeights: number[][][] = offspringNeuralNetwork.getWeights()
        const newBiases: number[][] = offspringNeuralNetwork.getBiases()


        // Use a crossover technique such as single-point crossover to combine
        // the genetic material of the parent neural networks and create a new offspring neural network
        for (let i = 0; i < newWeights.length; i++) {
            for (let j = 0; j < newWeights[i].length; j++) {
                for (let k = 0; k < newWeights[i][j].length; k++) {
                    if (Math.random() < 0.5) {
                        newWeights[i][j][k] = par1Weights[i][j][k]
                    } else {
                        newWeights[i][j][k] = par2Weights[i][j][k];
                    }
                }
            }
        }
        offspringNeuralNetwork.updateWeights(newWeights)

        // Also select one of the Biases of the parents
        for (let i = 0; i < newBiases.length; i++) {
            for (let j = 0; j < newBiases[i].length; j++) {
                if (Math.random() < 0.5) {
                    newBiases[i][j] = par1Biases[i][j];
                } else {
                    newBiases[i][j] = par2Biases[i][j];
                }
            }
        }
        offspringNeuralNetwork.updateBiases(newBiases)

        offspringNeuralNetwork.logWeightAndBias()

        // Return the new offspring individual
        return offspringNeuralNetwork
    }
}



