'use client'
import Image from "next/image";
import { Component } from "react";
import AnimatedBarChart from "./AnimatedBarChart";
import { Bar } from "react-chartjs-2";
import { Chart, registerables} from 'chart.js';

Chart.register(...registerables);


type Project = {
  project_id:number,
  required:Array<number>,
  optimal:Array<number>,
  weights:Array<number>,
  allocated:Array<number>
}

type Solution = Array<Project>

interface HomePageProps {}

interface HomePageState {
  b1_hover: boolean;
  b2_hover: boolean;
  b3_hover: boolean;
  b4_hover:boolean;
  b5_hover:boolean;
  b6_hover:boolean;
  selected_alg: string;
  algorithmRunning: boolean;
  projects: Solution;
  availableResources: number[];
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  };
  options: {
    animation: {
      duration: number;
    };
    scales: {
      y: {
        type: string;
        beginAtZero: boolean;
      };
      x: {
        ticks: {
          display: boolean;
        };
      };
    };
    maintainAspectRatio: boolean;
    responsive: boolean;
    plugins: {
      legend: {
        display: boolean;
        position: string;
      };
    };
    layout: {
      padding: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
    };
  };
  currentSolution: any[]; // Adjust the type according to your solution structure
  currentPerformance: number;
  stop: boolean;
  firstRun:boolean;
  iteration:number;
  generatingSolution:boolean;

  acceptOriginal:boolean;
  selectorMethod:string;
  maxIterations:number;
  selectedFile:any;
  currentStats:{
    waste:number,
    avgProjectSatisfaction:number,
    numActivated:number,
    sumPerformance:number,
  };
  sortVisuals:boolean;
}

export default class HomePage extends Component<HomePageProps, HomePageState>{
  constructor(props:HomePageProps) {
    super(props);

    this.state = {
      b1_hover:false,
      b2_hover:false,
      b3_hover:false,
      b4_hover:false,
      b5_hover:false,
      b6_hover:false,
      selected_alg:'ato',
      algorithmRunning:false,
      projects: [],
      availableResources: [],
      data: {
        labels: [],
        datasets: [
          {
            label: "Performance: ",
            data: [],
            backgroundColor: "goldenrod",
            borderColor: "goldenrod",
            borderWidth: 1,
          },
        ],
      },
      options: {
        animation: {
          duration: 200,
        },
        scales: {
          y: {
            type: 'linear', // specify the scale type
            beginAtZero: true,
          },
          x: {
            ticks: {
              display: true, // hide the x-axis ticks
            },
          },
        },
        maintainAspectRatio: false, // prevent the chart from maintaining aspect ratio
        responsive: true, // make the chart responsive
        plugins: {
          legend: {
            display: false,
            position: 'top', // adjust legend position as needed
          },
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }
        },
      },
      currentSolution:[],
      currentPerformance:0,
      stop:false,
      firstRun:true,
      iteration:0,
      generatingSolution:false,
      acceptOriginal:false,
      selectorMethod:'Random',
      maxIterations:3,
      selectedFile:null,
      currentStats:{
        waste:0,
        avgProjectSatisfaction:0,
        numActivated:0,
        sumPerformance:0,
      },
      sortVisuals:false,
      
    };
    
  }

  

  componentDidMount() {
    this.fetchData();
  }
  
  fetchData(){
    const file = this.state.selectedFile
    if (file){
      this.handleFileChange(file)
    }else{
      fetch('/project_data_30_5.json')
      .then(response => response.json())
      .then(data => {
        // Extract available resources and projects from the data
        const { meta, projects } = data;
        const availableResources = meta.available_resources;
        // Update state with fetched data
        this.setState({ availableResources, projects });
        this.setState({ currentSolution: projects})
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    }

  }

  genRanHex(size:number){
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  handleFileChange = (event:any) => {
    const selectedFile = event.target.files[0];

    this.setState({selectedFile: event})

    // Create a new FileReader instance
    const reader = new FileReader();

    // Define a function to handle file reading completion
    reader.onload = (event:any) => {
      if (event.target && event.target.result) {
        // Access the file content using event.target.result
        const data = JSON.parse(event.target.result);

        const { meta, projects } = data;
        const availableResources = meta.available_resources;
        this.setState({ availableResources, projects });
        this.setState({currentSolution: projects})
      }
    };

    // Read the contents of the selected file as text
    reader.readAsText(selectedFile);
};

  handleClicked(){
    this.fetchData();
    const valid = this.checkProblem();
    if (valid){
      this.setState({stop:false})
      this.runATO(this.state.maxIterations);
    }else{
      console.log('Invalid')
    }

  }

  checkProblem(){
    var problem:Solution = this.state.projects
    var availableResources = this.state.availableResources

    var sumResources = Array(availableResources.length).fill(0);

    for (const project of problem){
      for (var i = 0; i<availableResources.length;i++){
        sumResources[i] += project.optimal[i]
      }
    }

    var valid = true
    for (var i=0;i<availableResources.length;i++){
      if (sumResources[i] < availableResources[i]){
        console.log('invalid: ' + sumResources[i] + ' - ' + availableResources[i])
        valid = false
      }
    }
    return valid

  }

  generateRandomSolution = () => {
    var solution:Solution = this.state.projects
    var availableResources = this.state.availableResources

    for (var i = 0; i<availableResources.length;i++){
      while (availableResources[i] > 0){
        this.setState({generatingSolution:true})
        var random_index = Math.floor(Math.random() * solution.length)
        if (solution[random_index].allocated[i] < solution[random_index].optimal[i]){
          var amount = solution[random_index].optimal[i] - solution[random_index].allocated[i]
          if (amount <= availableResources[i]){
            solution[random_index].allocated[i] += amount;
            availableResources[i] -= amount;
          }else{
            solution[random_index].allocated[i] += availableResources[i];
            availableResources[i] -= availableResources[i];
          }

        }else{
          console.error('allocation failed - over optimal constraint')
        }
      }
    }
    this.setState({generatingSolution:false, currentPerformance:this.evaluateSolution(solution), currentSolution:solution})
    return solution
  }

  async runATO(timeoutCount: number) {
    this.setState({ algorithmRunning: true, currentSolution:[], currentPerformance:0});

    var solution:Solution = this.generateRandomSolution();
    var bestSolution: Solution = solution;
    var bestPerformance = this.evaluateSolution(solution)
    const numRandomAtoms = 2;
    const solutionLength = solution.length;

    const timeout = setTimeout(() => {
      this.setState({ stop: true });
    }, Math.round(this.state.maxIterations * 1000));
    
    var iterations = 0;
    while (!this.state.stop){
        // Select 2 Random Atoms
        var allIndices = Array.from({ length: solutionLength }, (_, index) => index);
        for (let i = solutionLength - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
        }
        var randomIndices = allIndices.slice(0, numRandomAtoms);
        var randomAtoms = randomIndices.map(index => solution[index]);
        var a1Index = solution.indexOf(randomAtoms[0]);
        var a2Index = solution.indexOf(randomAtoms[1]);

        var beforeScore = this.evaluateProject(randomAtoms[0]) + this.evaluateProject(randomAtoms[1])
        
        // collide two random atoms
        const adjustedAtoms= this.collide(randomAtoms);
        solution[a1Index] = adjustedAtoms[0];
        solution[a2Index] = adjustedAtoms[1];

        // Update best solution
        var currentEvaluation = this.evaluateSolution(solution);
        if (currentEvaluation > bestPerformance) {
            bestSolution = solution.slice();
            bestPerformance = currentEvaluation;
        
        // Update chart data
        var projects = bestSolution.map(p => p.project_id);
        var resourceAllocations = bestSolution.map(p => p.allocated);
        var requiredResourceAllocations = bestSolution.map(p => p.required);
        var optimalResourceAllocations = bestSolution.map(p => p.optimal);

        // Initialize arrays to store labels and data pairs
        var projectData = [];
        var projectsRequiredData = [];
        var projectsOptimalData = [];

        for (let j = 0; j < projects.length; j++) {
            const projectLabelPrefix = `Project${j}`;
          
            // Push resource labels and allocations for each project
            for (let k = 0; k < 3; k++) {
                const resourceLabel = `${projectLabelPrefix} (Resource ${k})`;
                projectData.push({ label: resourceLabel, value: resourceAllocations[j][k] });
                projectsRequiredData.push({ label: resourceLabel, value: requiredResourceAllocations[j][k] });
                projectsOptimalData.push({ label: resourceLabel, value: optimalResourceAllocations[j][k] });
            }
        }

        // Sort the data arrays while maintaining the association with labels
        if (this.state.sortVisuals){
            projectData.sort((a, b) => b.value - a.value);
            projectsRequiredData.sort((a, b) => b.value - a.value);
            projectsOptimalData.sort((a, b) => b.value - a.value);
        }

        // Extract sorted labels and data arrays
        var projectLabels = projectData.map(item => item.label);
        var projectResourceAllocations = projectData.map(item => item.value);
        var projectsRequired = projectsRequiredData.map(item => item.value);
        var projectsOptimal = projectsOptimalData.map(item => item.value);

      
        this.setState({
            data: {
                labels: projectLabels,
                datasets: [
                    {
                        label: "",
                        data: projectResourceAllocations,
                        backgroundColor: `goldenrod`,
                        borderColor: `orange`,
                        borderWidth: 1,
                    },
                    {
                      label: "Required",
                      data: projectsRequired, // Assuming project.required is an array containing required values for each project
                      type: 'line',
                      fill: false,
                      borderColor: 'red',
                      borderWidth: 2,
                  },
                  {
                    label: "Optimal",
                    data: projectsOptimal, // Assuming project.required is an array containing required values for each project
                    type: 'line',
                    fill: false,
                    borderColor: 'green',
                    borderWidth: 2,
                }
                ],
            },
            currentPerformance:Math.round(bestPerformance)
        });
      this.analysePerformance(bestSolution)
        
      await new Promise(resolve => setTimeout(resolve, this.state.maxIterations * 40 ));
      }

      if (this.state.stop){
        this.setState({algorithmRunning:false, stop:false})
        return
      }

    }
    clearTimeout(timeout);

    console.log('Best Solution: ' + bestPerformance)
    console.log('Solution')
    console.log(bestSolution)
    this.setState({ algorithmRunning: false });
}
  stopRunning(){
    this.setState({stop:true})
  }

  collide(atoms:Solution){
    var t1Atoms = atoms.slice();
    var t2Atoms = atoms.slice();

    const numberOfResources = this.state.availableResources.length

    // Trade 1
    for (var i = 0; i<numberOfResources;i++){
      if (t1Atoms[1].allocated[i] > 0){
        var randomP2Segments = [];
        if (t1Atoms[1].allocated[i] == 1){
          randomP2Segments = [t1Atoms[1].allocated[i]]
        }else{
          randomP2Segments = this.getSegments(t1Atoms[1].allocated[i], Math.floor(Math.random() * t1Atoms[1].allocated[i]))
        }
        const p1Wants = randomP2Segments.filter(x => t1Atoms[0].allocated[i] + x <= t1Atoms[0].optimal[i]);
        if (p1Wants.length > 0){
          var p1Want = p1Wants[Math.floor(Math.random() * p1Wants.length)];
          switch (this.state.selectorMethod){
            case 'Random':
              p1Want = p1Wants[Math.floor(Math.random() * p1Wants.length)];
              break;
            case 'Min':
              p1Want = Math.min(...p1Wants)
              break;
            case 'Max':
              p1Want = Math.max(...p1Wants)
              break;
          }
          t1Atoms[0].allocated[i] += p1Want
          t1Atoms[1].allocated[i] -= p1Want
        }
      }
    }
    
    // Trade 2
    const t1Score = this.evaluateProject(t1Atoms[0]) + this.evaluateProject(t1Atoms[1]);

    for (var i = 0; i<numberOfResources;i++){
      if (t2Atoms[1].allocated[i] > 0){
        var randomP1Segments = [];
        if (t2Atoms[1].allocated[i] == 1){
          randomP1Segments = [t2Atoms[0].allocated[i]]
        }else{
          randomP1Segments = this.getSegments(t2Atoms[0].allocated[i], Math.floor(Math.random() * t2Atoms[0].allocated[i]))
        }
        const p2Wants = randomP1Segments.filter(x => t2Atoms[1].allocated[i] + x <= t2Atoms[1].optimal[i]);
        
        if (p2Wants.length > 0){
          var p2Want = p2Wants[Math.floor(Math.random() * p2Wants.length)];
          switch (this.state.selectorMethod){
            case 'Random':
              p2Want = p2Wants[Math.floor(Math.random() * p2Wants.length)];
              break;
            case 'Min':
              p2Want = Math.min(...p2Wants)
              break;
            case 'Max':
              p2Want = Math.max(...p2Wants)
              break;
          }
          t2Atoms[1].allocated[i] += p2Want
          t2Atoms[0].allocated[i] -= p2Want
        }
      }
    }

    // Trade Comparison
    const t2Score = this.evaluateProject(t2Atoms[0]) + this.evaluateProject(t2Atoms[1]);
    const t0Score = this.evaluateProject(atoms[0]) + this.evaluateProject(atoms[1]);
    if (t0Score > t1Score && t0Score > t2Score && this.state.acceptOriginal){
      return atoms
    }
    if (t1Score > t2Score){
      return t1Atoms
    }else {
      return t2Atoms
    }
  }

  evaluateSolution(solution:Solution){
    // Solution Evaluation Function
    var sumPerformance = 0
    for (const project of solution){
      sumPerformance += this.evaluateProject(project)
    }
    return sumPerformance
  }

  evaluateProject(project:Project){
    // Project Evaluation Function
    var numberOfResources = this.state.availableResources.length
    var sumPerformance = 0
    var requirementsMet = true
    for (var i = 0; i<numberOfResources;i++){
      if (project.allocated[i] < project.required[i]){ 
        requirementsMet = false
      }
    }
    if (requirementsMet){
      sumPerformance += this.calculatePerformance(project)
    }else{
      sumPerformance -= this.calculatePerformance(project) * 0.75
    }

    return sumPerformance
  }

  calculatePerformance(project:Project){
    // Project Return Function
    const allocated = project.allocated
    const required = project.required
    const weights = project.weights
    // Check if the lists have the same length
      if (allocated.length !== weights.length) {
        throw new Error("Lists must have the same length");
    }
    // Initialize the sum
    var sum = 0;
    
    // Iterate through both lists and accumulate the sum
    for (var i = 0; i < allocated.length; i++) {
      sum += allocated[i] * weights[i];
    }
    
    // Return the sum
    return sum;
  }

  analysePerformance(solution:Solution){
    // Solution Analysis Function
    var numActivated = 0
    var sumPerformance = 0
    var sumResourcesUsed = Array(this.state.availableResources.length).fill(0);
    var sumProjectSatisfaction = 0
    var numOverOptimal = 0
    var waste = 0
    console.log('ar: ' + this.state.availableResources)
    for (const project of solution){
        var requirementsMet = true
        var projectSatisfaction = 0
        for (var i=0;i<project.allocated.length;i++){
            sumResourcesUsed[i] += project.allocated[i]
            
            // Negating Performance If A Resource Requirement is not met
            if (project.allocated[i] < project.required[i]){
              requirementsMet = false
              waste += project.allocated[i]
            }else{
              projectSatisfaction += (project.allocated[i] * project.weights[i]) / (project.optimal[i] * project.weights[i])
            }
            // Optimal resource allocation Check
            if (project.allocated[i] > project.optimal[i]){
              numOverOptimal += 1
            }
        }
        if (requirementsMet == true){
          numActivated += 1
          sumProjectSatisfaction += projectSatisfaction
          sumPerformance += this.calculatePerformance(project)
        }
      }
    console.log(sumProjectSatisfaction)
    const avgProjectSatisfaction = sumProjectSatisfaction/(numActivated*this.state.availableResources.length)
    console.log(`Over Optimal: ${numOverOptimal}`)
    console.log(sumResourcesUsed)
    console.log(this.state.availableResources)
    console.log(`Resources Used Constraint Check: ${this.state.availableResources.every((element, index) => element === sumResourcesUsed[index])}, Over Optimal Constraint Check: ${numOverOptimal == 0}`)
    console.log(`Activated Projects: ${numActivated}/${(solution.length)}`)
    console.log(`Sum Return: ${this.evaluateSolution(solution)}`)
    console.log(`Avg Project Satisfaction (Of Activated): ${avgProjectSatisfaction}`)
    console.log(`Wasted Resources: ${waste}`)
    this.setState({currentStats:{
      waste:waste,
      avgProjectSatisfaction:avgProjectSatisfaction,
      numActivated:numActivated,
      sumPerformance:sumPerformance,
    }})
    return [sumPerformance, avgProjectSatisfaction, waste]
  }

  handleFileButtonClick = () => {
    const fileInputElement = document.getElementById('fileInput');
    if (fileInputElement) {
        fileInputElement.click();
    } else {
        console.error('File input element not found');
    }
};


  getSegments(a:number, n:number) {
    var pieces = [];
    for (var idx = 0; idx < n - 1; idx++) {
        // Calculate the maximum value this segment can take
        var maxPiece:number = a - pieces.reduce((acc, val) => acc + val, 0) - (n - idx - 1);
        // Generate a random number within the possible range
        var piece = Math.floor(Math.random() * maxPiece) + 1;
        pieces.push(piece);
    }
    // Append last segment
    pieces.push(a - pieces.reduce((acc, val) => acc + val, 0));
    return pieces;
  }

  render(){
    return (
      <div style={{backgroundColor:'#222222',width: '100vw', height:'100vh'}}>
        <div style={
            {
              backgroundColor:'#222222',
              width:'100vw',
              height:'12vh',
              display:'flex',
              flex:1,
              alignItems:'center',
              justifyContent:'center',
              flexDirection:'column'
            }
          }
          >
            <label style={{color:'white', fontSize:'30px', fontFamily:'monospace', fontWeight:'bold', textAlign:'center', marginTop:'20px'}}>Altruistic Trade Optimisation (ATO) Demo</label>
            <label style={{color:'white', fontSize:'20px', fontFamily:'monospace', textAlign:'center'}}>A Nature-Inspired Algorithm for Resource Allocation in Project Management</label>
          </div>
          <div style={{backgroundColor:'goldenrod', width:'80vw', marginLeft:'10vw', height:'3px', display:'flex', flex:1, flexDirection:'row'}}></div>
          <div style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: '#313131',
                width: '90vw',
                height: '80vh',
                marginLeft:'5vw',
                marginTop: '20px',
                borderRadius: '6px',
                borderColor:'goldenrod',
                borderWidth:'3px'
            }}>
            <div style={{
                flex: 1,
                margin: '15px',
                }}>
              <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'start',
              marginLeft: '15px',
              marginTop:'15px',
              width: '100%',
            }}>
              <div style={{flexDirection:'column', flex:1,display:'flex', position:'absolute', right:'25vw'}}>
                <label
                style={{
                  alignSelf: 'center',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '40px'}}>{`Sum Return: ${Math.round(this.state.currentStats.sumPerformance * 10) / 10}`}</label>
              <label
                style={{
                  alignSelf: 'center',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '40px'
                }}
              >
                {`Best Solution Fitness: ${this.state.currentPerformance}`}
              </label>
              <label
                style={{
                  alignSelf: 'center',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '40px'}}>{`Wasted Resources: ${this.state.currentStats.waste}`}</label>
              <label
                style={{
                  alignSelf: 'center',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '40px'}}>{`Num Activated: ${this.state.currentStats.numActivated} / ${this.state.currentSolution.length}`}</label>
              <label
                style={{
                  alignSelf: 'center',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '40px'}}>{`Average Project Satisfaction: ${Math.round(this.state.currentStats.avgProjectSatisfaction * 100) / 100}`}</label>
              </div>


            </div>

              <div style={{display:'flex', flex:1,flexDirection:'row', justifyContent:'center',bottom:'15px', position:'unset'}}>

              </div>
              <div style={{width:'100%', height:'72vh',flex:1, display:"flex", justifyContent:'center', marginTop:'25px'}}>
                <AnimatedBarChart data={this.state.data} options={this.state.options} />
              </div>
            </div>
            <div style={{
                backgroundColor: '#454545',
                width: '20vw',
                height: '100%',
                borderTopRightRadius: '6px',
                borderBottomRightRadius: '6px',
                borderColor:'goldenrod',
                borderLeftWidth:'3px',
                display:'flex',
                flexDirection:'column',
                justifyContent:'start',
                alignItems:'start',
                padding:'10px'
            }}>
            <input
                type="file"
                onChange={this.handleFileChange}
                id="fileInput"
                style={{ display: 'none' }}
            />
            <button
                onMouseEnter={() => this.setState({ b5_hover: true })}
                onMouseLeave={() => this.setState({ b5_hover: false })}
                onClick={this.handleFileButtonClick}
                disabled={this.state.algorithmRunning}
                style={{
                    alignSelf: 'center',
                    outline: 'none',
                    textAlign: 'center',
                    marginTop: '10px',
                    marginBottom: '10px',
                    backgroundColor: this.state.b5_hover ? '#676767' : '#545454',
                    color: 'white',
                    padding: '10px',
                    width:'18vw',
                    paddingLeft: '15px',
                    paddingRight: '15px',
                    borderRadius: '6px',
                    fontSize: '15px',
                    maxWidth:'18vw',
                    fontFamily: 'monospace',
                    borderColor: 'goldenrod',
                    borderWidth: '3px'
                }}
            >
                Set Problem Data File
            </button>

                <button
                disabled={this.state.algorithmRunning}
                onMouseEnter={() => this.setState({ b3_hover: true })}
                onMouseLeave={() => this.setState({ b3_hover: false })}
                onClick={() => this.setState({acceptOriginal:!this.state.acceptOriginal})}
                style={{
                  alignSelf:'center',
                  marginBottom: '10px',
                  backgroundColor: this.state.acceptOriginal ? 'goldenrod' : (this.state.b3_hover ? '#676767' : '#545454'),
                  color: 'white',
                  padding: '10px',
                  width:'18vw',
                  paddingLeft: '15px',
                  paddingRight: '15px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                {`Accept Original (${this.state.acceptOriginal ? `On` : `Off`})`}
              </button>

              <button
                onMouseEnter={() => this.setState({ b4_hover: true })}
                onMouseLeave={() => this.setState({ b4_hover: false })}
                onClick={() => this.state.selectorMethod === 'Random' ?  this.setState({selectorMethod:'Min'}) : (this.state.selectorMethod === 'Min' ?  this.setState({selectorMethod:'Max'}) : this.setState({selectorMethod:'Random'}))}
                disabled={this.state.algorithmRunning}
                style={{
                  alignSelf:'center',
                  marginBottom: '10px',
                  backgroundColor: this.state.b4_hover ? '#676767' : '#545454',
                  color: 'white',
                  padding: '10px',
                  paddingLeft: '15px',
                  width:'18vw',
                  paddingRight: '15px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  maxWidth:'18vw',
                  fontFamily: 'monospace',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                {`Selector (${this.state.selectorMethod})`}
              </button>
              <input
              type="number"
                onChange={(e)=>this.setState({maxIterations: parseInt(e.currentTarget.value)})}
                placeholder="Runtime (s)"
                max={30}
                maxLength={2}
                disabled={this.state.algorithmRunning}
                value={this.state.maxIterations}
                style={{
                  alignSelf:'center',
                  outline:'none',
                  width:'18vw',
                  textAlign:'center',
                  marginBottom: '10px',
                  backgroundColor: this.state.b1_hover ? '#676767' : '#545454',
                  color: 'white',
                  borderRadius: '6px',
                  maxWidth:'18vw',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}></input>
                              <button
                disabled={this.state.algorithmRunning}
                onMouseEnter={() => this.setState({ b6_hover: true })}
                onMouseLeave={() => this.setState({ b6_hover: false })}
                onClick={() => this.setState({sortVisuals:!this.state.sortVisuals})}
                style={{
                  alignSelf:'center',
                  marginBottom: '10px',
                  backgroundColor: this.state.sortVisuals ? 'goldenrod' : (this.state.b6_hover ? '#676767' : '#545454'),
                  color: 'white',
                  padding: '10px',
                  width:'18vw',
                  paddingLeft: '15px',
                  paddingRight: '15px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                {`Sort Visuals (${this.state.sortVisuals ? `On` : `Off`})`}
              </button>
                  <button
                onMouseEnter={() => this.setState({ b2_hover: true })}
                onMouseLeave={() => this.setState({ b2_hover: false })}
                onClick={() => { if (this.state.algorithmRunning) { this.stopRunning() } else { this.handleClicked() } }}
                style={{
                  backgroundColor: this.state.b2_hover || this.state.algorithmRunning === true ? 'goldenrod' : '#545454',
                  alignSelf:'center',
                  outline:'none',
                  bottom:'70px',
                  position:'absolute',
                  textAlign:'center',
                  color: 'white',
                  padding: '10px',
                  paddingLeft: '15px',
                  paddingRight: '15px',
                  width:'18vw',

                  maxWidth:'18vw',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontFamily: 'monospace',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                {this.state.algorithmRunning ? (this.state.generatingSolution ? 'Generating Solution' : 'Press To Stop') : 'Find Optimal Solution'}
              </button>
            </div>
          </div>

            
      </div>
    );
  }

}