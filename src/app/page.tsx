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

interface HomePageProps {
  // Define the type for props here if needed
}

interface HomePageState {
  b1_hover: boolean;
  b2_hover: boolean;
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
}


export default class HomePage extends Component<HomePageProps, HomePageState>{
  constructor(props:HomePageProps) {
    super(props);

    this.state = {
      b1_hover:false,
      b2_hover:false,
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
              display: false, // hide the x-axis ticks
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
      firstRun:true
      
    };
    
  }

  

  componentDidMount() {
    this.fetchData();
  }
  
  fetchData(){
    fetch('/project_data.json')
    .then(response => response.json())
    .then(data => {
      // Extract available resources and projects from the data
      const { meta, projects } = data;
      const availableResources = meta.available_resources;
      // Update state with fetched data
      this.setState({ availableResources, projects });
      this.setState({currentSolution: projects})
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }

  genRanHex(size:number){
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }


  handleClicked(){
    this.setState({stop:false})
    this.runATO(200000);
  }

  generateRandomSolution = () => {
    var solution:Solution = this.state.projects
    var availableResources = this.state.availableResources
    for (var i = 0; i<availableResources.length;i++){
      while (availableResources[i] > 0){
        console.log('Generating Random Solution')
        var random_index = Math.floor(Math.random() * solution.length)
          if (solution[random_index].allocated[i] < solution[random_index].optimal[i]){
            solution[random_index].allocated[i] += 1;
            availableResources[i] -= 1
          }else{
            console.error('allocation failed - over optimal constraint')
          }
        }
        console.log('Random Solution Generated')
    }
    return solution
  }

  async runATO(timeoutCount: number) {
    this.setState({ algorithmRunning: true, currentSolution:[], currentPerformance:0});
      var solution:Solution = this.generateRandomSolution();
    // if (this.state.firstRun){
    // }else{
    //   solution = this.state.currentSolution;
    // }
    // this.setState({firstRun:false})

    var bestSolution: Solution = solution;
    var bestPerformance = this.evaluateSolution(solution)
    const numRandomAtoms = 2;
    const solutionLength = solution.length;

    // const timeout = setTimeout(() => {
    //   // Set the flag to stop the loop after 15 seconds
    //   this.setState({ stop: true });
    // }, timeoutCount);

    // while (!this.state.stop){
    for (var i = 0; i< timeoutCount;i++){
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

        var adjustedAtoms: Solution = this.collide(randomAtoms);

        solution[a1Index] = adjustedAtoms[0];
        solution[a2Index] = adjustedAtoms[1];

        var currentEvaluation = this.evaluateSolution(solution);
        if (currentEvaluation > bestPerformance) {
            bestSolution = solution.slice();
            bestPerformance = currentEvaluation;
            console.log(bestPerformance)
        

        // Update chart data
        var projects = bestSolution.map(p => p.project_id);
        var resourceAllocations = bestSolution.map(p => p.allocated);

        var projectLabels = [];
        var projectResourceAllocations = [];

        for (let j = 0; j < projects.length; j++) {
          const projectLabelPrefix = `Project${j}`;
      
          // Push resource labels and allocations for each project
          for (let k = 0; k < 3; k++) {
              projectLabels.push(`${projectLabelPrefix} (Resource ${k})`);
              projectResourceAllocations.push(resourceAllocations[j][k]);
          }
        }
      
        // Update chart data in the state
        this.setState({
            data: {
                labels: projectLabels,
                datasets: [
                    {
                        label: "",
                        data: projectResourceAllocations,
                        backgroundColor: `goldenrod`,
                        borderColor: `black`,
                        borderWidth: 1,
                    },
                ],
            },
            currentPerformance:Math.round(bestPerformance)
        });

        // Delay to visualize each iteration (optional)
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (this.state.stop){
        this.setState({algorithmRunning:false, stop:false})
        return
      }
    }
    // clearTimeout(timeout);

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
          var p1Want = Math.max(...p1Wants);
          t1Atoms[0].allocated[i] += p1Want
          t1Atoms[1].allocated[i] -= p1Want
        }
      }
    }
    
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
          var p2Want = Math.max(...p2Wants);

          t2Atoms[1].allocated[i] += p2Want
          t2Atoms[0].allocated[i] -= p2Want
        }
      }
    }
    const t2Score = this.evaluateProject(t2Atoms[0]) + this.evaluateProject(t2Atoms[1]);

    if (t1Score > t2Score){
      return t1Atoms
    }else {
      return t2Atoms
    }
  }

  evaluateSolution(solution:Solution){
    var sumPerformance = 0
    for (const project of solution){
      sumPerformance += this.calculatePerformance(project)
    }
    return sumPerformance
  }

  evaluateProject(project:Project){
    var numberOfResources = project.required.length
    var sumPerformance = 0
    var requirementsMet = true
    for (var i = 0; i<numberOfResources;i++){
        if (project.allocated[i] < project.required[i]){
          requirementsMet = false
          sumPerformance += this.calculatePerformance(project)
        }else{
          sumPerformance -= this.calculatePerformance(project)
        }
      }
    // if (requirementsMet){    
    //     sumPerformance += this.calculatePerformance(project)
    // }else{
        
    // }
    return sumPerformance
  }

  calculatePerformance(project:Project){
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
            <label style={{color:'white', fontSize:'30px', fontFamily:'monospace', fontWeight:'bold'}}>Altruistic Trade Optimisation (ATO) Demo</label>
            <label style={{color:'white', fontSize:'20px', fontFamily:'monospace'}}>A Nature-Inspired Algorithm for Resource Allocation in Project Management</label>
          </div>
          <div style={{backgroundColor:'goldenrod', width:'80vw', marginLeft:'10vw', height:'3px'}}></div>
          <div style={{
                backgroundColor:'#343434',
                width:'86vw',
                height:'80vh',
                display:'flex',
                flex:1,
                alignItems:'start',
                justifyContent:'center',
                flexDirection:'row',
                marginLeft:'7vw',
                marginTop:'20px',
                borderRadius:'6px'
          }}>
            <div style={{alignItems:'center', justifyContent:'start',flexDirection:'column', display:'block', flex:1, marginTop:'10', height:'100%', width:'100%'}}>
              <div style={{display:'flex', flex:1,flexDirection:'row', justifyContent:'center',marginBottom:'15px'}}>
                {/* <button onMouseEnter={()=>this.setState({b4_hover:true})} onMouseLeave={()=>this.setState({b4_hover:false})} onClick={()=>this.setState({selected_alg:'ga'})} style={{backgroundColor:this.state.b4_hover || this.state.selected_alg === 'ga' ? 'goldenrod':'#545454',color:'white', padding:'10px', paddingLeft:'15px', paddingRight:'15px',borderRadius:'6px', fontSize:'20px', fontFamily:'monospace', marginRight:'10px', borderColor:'goldenrod', borderWidth:'3px'}}>Genetic Algorithm
                
                </button>
                <button onMouseEnter={()=>this.setState({b5_hover:true})} onMouseLeave={()=>this.setState({b5_hover:false})} onClick={()=>this.setState({selected_alg:'gga'})} style={{backgroundColor:this.state.b5_hover || this.state.selected_alg === 'gga' ? 'goldenrod':'#545454',color:'white', padding:'10px', paddingLeft:'15px', paddingRight:'15px',borderRadius:'6px', fontSize:'20px', fontFamily:'monospace', marginRight:'10px', borderColor:'goldenrod', borderWidth:'3px'}}>Altruistic Algorithm
              
              </button> */}
                </div>
                <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'start',
              marginLeft: '15px',
              width: '100%'
            }}>
              <button
                onMouseEnter={() => this.setState({ b1_hover: true })}
                onMouseLeave={() => this.setState({ b1_hover: false })}
                onClick={() => this.handleClicked()}
                style={{
                  marginBottom: '20px',
                  backgroundColor: this.state.b1_hover ? '#676767' : '#545454',
                  color: 'white',
                  padding: '10px',
                  paddingLeft: '15px',
                  paddingRight: '15px',
                  borderRadius: '6px',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  marginRight: '10px',
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                Set File
              </button>
              <button
                onMouseEnter={() => this.setState({ b2_hover: true })}
                onMouseLeave={() => this.setState({ b2_hover: false })}
                onClick={() => { if (this.state.algorithmRunning) { this.stopRunning() } else { this.handleClicked() } }}
                style={{
                  marginBottom: '20px',
                  backgroundColor: this.state.b2_hover || this.state.algorithmRunning === true ? 'goldenrod' : '#545454',
                  color: 'white',
                  padding: '10px',
                  paddingLeft: '15px',
                  paddingRight: '15px',
                  borderRadius: '6px',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  marginRight: 'auto', // aligns the button to the leftmost side
                  borderColor: 'goldenrod',
                  borderWidth: '3px'
                }}
              >
                {this.state.algorithmRunning ? 'Running... Press Again To Stop' : 'Find Optimal Solution'}
              </button>
              <label
                style={{
                  alignSelf: 'center',
                  fontSize: '20px',
                  fontFamily: 'monospace',
                  color: 'white',
                  marginLeft: 'auto',
                  marginRight : '60px'
                }}
              >
                {`Optimal Performance: ${this.state.currentPerformance}`}
              </label>
            </div>

              <div style={{display:'flex', flex:1,flexDirection:'row', justifyContent:'center',bottom:'15px', position:'unset'}}>

              </div>
              <div style={{width:'100%', height:'60vh',flex:1, display:"flex", justifyContent:'center', marginTop:'25px'}}>
                <AnimatedBarChart data={this.state.data} options={this.state.options} />
              </div>
            </div>
            </div>
      </div>
    );
  }

}