import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const BMICalculator = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateBMI = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Fix 1: Update the API endpoint URL to include the full path to your Django backend
      // If you're using a proxy in development, you might not need the full URL
      const response = await axios.post('/api/calculate-bmi/', {
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        sex
      });
      
      setBmiResult(response.data);
    } catch (err) {
      // Fix 2: Improved error handling to show the actual error message
      setError(`Failed to calculate BMI: ${err.response?.data?.error || err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Alternative calculation function that doesn't rely on the API
  const calculateBMILocally = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Convert height from cm to meters
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      
      // Calculate BMI
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      const roundedBMI = Math.round(bmi * 10) / 10; // Round to 1 decimal place
      
      // Determine status
      let status;
      if (bmi < 18.5) {
        status = "Underweight";
      } else if (bmi >= 18.5 && bmi < 25) {
        status = "Healthy";
      } else if (bmi >= 25 && bmi < 30) {
        status = "Overweight";
      } else {
        status = "Obese";
      }
      
      setBmiResult({
        bmi: roundedBMI,
        status: status
      });
    } catch (err) {
      setError('Failed to calculate BMI. Please check your inputs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBMIStatusColor = (status) => {
    switch (status) {
      case 'Underweight':
        return 'text-warning';
      case 'Healthy':
        return 'text-success';
      case 'Overweight':
        return 'text-warning';
      case 'Obese':
        return 'text-danger';
      default:
        return '';
    }
  };

  return (
    <div className="container-fluid p-0 bg-dark text-light min-vh-100">
      <div className="row m-0">
        <div className="col-lg-6 p-5">
          <div className="mb-5">
            <h5 className="text-warning">CHECK YOUR BODY</h5>
            <h1 className="display-4 text-white">BMI CALCULATOR CHART</h1>
          </div>
          
          <div className="table-responsive">
            <table className="table table-dark table-bordered">
              <thead>
                <tr>
                  <th className="text-center">BMI</th>
                  <th className="text-center">WEIGHT STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Below 18.5</td>
                  <td className="text-warning">Underweight</td>
                </tr>
                <tr>
                  <td>18.5 - 24.9</td>
                  <td className="text-success">Healthy</td>
                </tr>
                <tr>
                  <td>25.0 - 29.9</td>
                  <td className="text-warning">Overweight</td>
                </tr>
                <tr>
                  <td>30.0 - and Above</td>
                  <td className="text-danger">Obese</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="col-lg-6 p-5">
          <div className="mb-5">
            <h5 className="text-warning">CHECK YOUR BODY</h5>
            <h1 className="display-4 text-white">CALCULATE YOUR BMI</h1>
          </div>
          
          <p className="text-secondary mb-4">
            Enter your details below to calculate your Body Mass Index (BMI). 
            BMI is a measurement that indicates whether you have a healthy weight for your height.
          </p>
          
          {/* Fix 3: Changed to use the local calculation function instead of API */}
          <form onSubmit={calculateBMILocally}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control bg-dark text-light border-secondary"
                    id="height"
                    placeholder="Height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                  />
                  <label htmlFor="height" className="text-secondary">Height / cm</label>
                </div>
              </div>
              
              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control bg-dark text-light border-secondary"
                    id="weight"
                    placeholder="Weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                  <label htmlFor="weight" className="text-secondary">Weight / kg</label>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control bg-dark text-light border-secondary"
                    id="age"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                  <label htmlFor="age" className="text-secondary">Age</label>
                </div>
              </div>
              
              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    id="sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <label htmlFor="sex" className="text-secondary">Sex</label>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-warning btn-lg w-100 py-3 mt-3"
              disabled={loading}
            >
              {loading ? 'CALCULATING...' : 'CALCULATE'}
            </button>
          </form>
          
          {error && <div className="alert alert-danger mt-4">{error}</div>}
          
          {bmiResult && (
            <div className="mt-4 p-4 border border-secondary rounded">
              <h4 className="mb-3">Your Results</h4>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="display-4 mb-0">{bmiResult.bmi}</h2>
                  <p className={`mb-0 ${getBMIStatusColor(bmiResult.status)}`}>
                    {bmiResult.status}
                  </p>
                </div>
                <div className="text-end">
                  <p className="mb-0 text-secondary">Your BMI indicates your weight is in the</p>
                  <p className={`mb-0 fw-bold ${getBMIStatusColor(bmiResult.status)}`}>
                    {bmiResult.status} range
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;