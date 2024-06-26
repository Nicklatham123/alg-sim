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

}

export default class HomePage extends Component<HomePageProps, HomePageState>{
  constructor(props:HomePageProps) {
    super(props);

    this.state = {

    }
    
  }

  componentDidMount() {
    this.fetchData();
  }
  
  fetchData(){
    const file = this.state.selectedFile
    if (file){
      this.handleFileChange(file)
    }else{
      fetch('/project_data_30_2.json')
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
            
      </div>
    );
  }

}