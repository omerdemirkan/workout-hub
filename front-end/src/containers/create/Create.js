import React from 'react';
import axios from '../../axios';
import { connect } from 'react-redux'
import * as actionTypes from '../../store/actions/actionTypes'
import { colorsByDisplay } from '../../helper/colors-by-path';
import PreviewCard from '../../components/UI/PreviewCard/PreviewCard'

import classes from './Create.module.css';

import Filter from 'bad-words';

// Material UI

import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';

import grey from '@material-ui/core/colors/grey';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles';

import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';

import CloseRoundedIcon from '@material-ui/icons/CloseRounded';
import DeleteIcon from '@material-ui/icons/Delete';


const profanityFilter = new Filter();

const theme = createMuiTheme({
  palette: {
    primary: {
        500: grey[700],
        backgroundColor: grey[100]
    }
  }
});

const exerciseErrorMessages = {
    title: 'Exercise titles must be between 4 and 20 characters',
    sets: 'Sets must be between 1 and 10',
    reps: 'Reps must be between 1 and 30',
    minutes: 'Minutes must be between 0 and 120',
    seconds: 'Seconds must be between 0 and 59',
    noDuration: 'Exercises must have a duration',
    uniqueTitle: 'Each exercise title must be unique',
    profanity: 'No profanity allowed!'
}

// Number value and string length limites in [min, max] format
const valueLimits = {
    title: [4, 20],
    sets: [1, 10],
    reps: [1, 30],
    minutes: [0, 120],
    seconds: [0, 59]
}

class Create extends React.Component {
    state = {
        currentExercise: {
            title: '',
            type: 'sets-reps',
            sets: 0,
            reps: 0,
            minutes: 0,
            seconds: 0
        },
        errors: [],
        errorMessages: [],
        deleteWorkoutModal: false
    }

    updateExerciseHandler = (event, field) => {
        let newExercise = {...this.state.currentExercise};
        if (field === 'title' || field === 'type') {
            newExercise[field] = event.target.value;
            this.setState({currentExercise: newExercise});
        } else {
            newExercise[field] = Number(event.target.value);
            this.setState({currentExercise: newExercise});
        }
    }

    addExerciseHandler = () => {
        const foundErrors = this.checkForErrors()
        if (foundErrors.length === 0) {
            let exercise = null;
            if (this.state.currentExercise.type === 'sets-reps') {
                exercise = {
                    title: this.state.currentExercise.title.trim(),
                    type: this.state.currentExercise.type,
                    sets: this.state.currentExercise.sets,
                    reps: this.state.currentExercise.reps
                }
            } else {
                exercise = {
                    title: this.state.currentExercise.title,
                    sets: this.state.currentExercise.sets,
                    minutes: this.state.currentExercise.minutes,
                    seconds: this.state.currentExercise.seconds
                }
            }
            this.props.onAddExercise(exercise);
            this.resetCurrentExercise();
        } else {
            const errorMessages = [];
            Object.keys(exerciseErrorMessages).forEach(errorName => {
                foundErrors.forEach(foundError => {
                    if (errorName === foundError) {
                        errorMessages.push(exerciseErrorMessages[errorName])
                    }
                });
            });
            this.setState({errors: foundErrors, errorMessages: errorMessages});
        }
    }

    changeTypeHandler = event => {
        console.log(event.target.value);
        if (event.target.value === 'sets-reps') {
            const newExercise = {...this.state.currentExercise};
            newExercise.minutes = 0;
            newExercise.seconds = 0;
            newExercise.sets = 0;
            newExercise.type = event.target.value;
            this.setState({currentExercise: newExercise});
        } else {
            const newExercise = {...this.state.currentExercise};
            newExercise.reps = 0;
            newExercise.sets = 0;
            newExercise.type = event.target.value;
            this.setState({currentExercise: newExercise});
        }
    }

    checkForErrors = () => {
        let errors = [];

        // Checking title: 
        if (this.state.currentExercise.title.length < valueLimits.title[0] || this.state.currentExercise.title.length > valueLimits.title[1]) {
            errors.push('title');
        }

        // Checking sets-reps / sets-min-sec: 
        let relevantFields = null
        if (this.state.currentExercise.type === 'sets-reps') {
            relevantFields = ['sets', 'reps'];
        } else {
            relevantFields = ['sets', 'minutes', 'seconds'];

            // Checking for a positive duration (because minutes and seconds can be 0 seperately, but not at the same time): 
            if (this.state.currentExercise.seconds === 0 && this.state.currentExercise.minutes === 0) {
                errors.push('noDuration');
            }
        }
        relevantFields.forEach(field => {
            if (this.state.currentExercise[field] < valueLimits[field][0] || this.state.currentExercise[field] > valueLimits[field][1]) {
                errors.push(field);
            }
        });

        //Checking for unique exercise name:
        if (this.props.exercises.length > 0) {
            let copyFound = false;
            this.props.exercises.forEach(exercise => {
                if (this.state.currentExercise.title.trim() === exercise.title) {
                    copyFound = true;
                }
            });
            if (copyFound) {
                errors.push('uniqueTitle');
            }
        }

        //Checking for profanity:
        if (profanityFilter.clean(this.state.currentExercise.title) !== this.state.currentExercise.title) {
            errors.push('profanity');
        }

        return errors;
    }

    resetCurrentExercise = () => {
        const newExercise = {...this.state.currentExercise}
        newExercise.title = '';
        newExercise.type = 'sets-reps';
        // Sets, reps, minutes and seconds left as is.
        this.setState({
            currentExercise: newExercise,
            errors: [],
            errorMessages: []
        });
    }

    closeErrorModalHandler = () => {
        this.setState({
            errors: [],
            errorMessages: [],
        });
    }

    openDeleteModalHandler = () => {
        this.setState({deleteWorkoutModal: true});
    }

    closeDeleteModalHandler = () => {
        this.setState({deleteWorkoutModal: false});
    }

    deleteWorkoutHandler = () => {
        this.props.onDeleteWorkout();
        this.setState({
            currentExercise: {
                title: '',
                type: 'sets-reps',
                sets: 0,
                reps: 0,
                minutes: 0,
                seconds: 0
            },
            errors: [],
            errorMessages: [],
            deleteWorkoutModal: false
        });
    }

    render() {
        // If the user chooses the sets-reps format, we need inputs for sets and reps,
        // otherwise, we need sets, minutes and seconds as inputs.

        let inputsBasedOnFormat = null;
        if (this.state.currentExercise.type === 'sets-reps') {
            inputsBasedOnFormat = <div>
                <TextField
                id="outlined-number"
                label="Sets"
                value={this.state.currentExercise.sets ? this.state.currentExercise.sets: ''}
                type="number"
                variant="outlined"
                style={{width: '50%', height: '30px', color: 'rgb(71, 71, 71)', marginBottom: '30px'}}
                onChange={event => this.updateExerciseHandler(event, 'sets')}
                />
                <TextField
                id="outlined-number"
                label="Reps"
                type="number"
                value={this.state.currentExercise.reps ? this.state.currentExercise.reps: ''}
                variant="outlined"
                style={{width: '50%', height: '30px', color: 'rgb(71, 71, 71)', marginBottom: '30px'}}
                onChange={event => this.updateExerciseHandler(event, 'reps')}
                />
            </div>
        } else {
            inputsBasedOnFormat = <div>
                <TextField
                id="outlined-number"
                label="Sets"
                type="number"
                value={this.state.currentExercise.sets ? this.state.currentExercise.sets: ''}
                variant="outlined"
                style={{width: '100%', height: '40px', color: 'rgb(71, 71, 71)', marginBottom: '30px'}}
                onChange={event => this.updateExerciseHandler(event, 'sets')}
                />
                <TextField
                id="outlined-number"
                label="Minutes"
                type="number"
                value={this.state.currentExercise.minutes ? this.state.currentExercise.minutes: ''}
                variant="outlined"
                style={{width: '50%', height: '40px', color: 'rgb(71, 71, 71)', marginBottom: '30px'}}
                onChange={event => this.updateExerciseHandler(event, 'minutes')}
                />
                <TextField
                id="outlined-number"
                label="Seconds"
                type="number"
                value={this.state.currentExercise.seconds ? this.state.currentExercise.seconds: ''}
                variant="outlined"
                style={{width: '50%', height: '40px', color: 'rgb(71, 71, 71)', marginBottom: '30px'}}
                onChange={event => this.updateExerciseHandler(event, 'seconds')}
                />
            </div>
        }
        let workout = null;
        if (this.props.exercises.length > 0) {
            workout = {
                title: this.props.title,
                type: this.props.select,
                exercises: this.props.exercises
            }
        }


        return <React.Fragment>
        <h1 className={classes.MainHeader}>Create Your Workout</h1>
        <div className={classes.Create}>
            <ThemeProvider theme={theme}>
                <TextField 
                    id="standard-basic" 
                    label="Title" 
                    placeholder="e.g. Heavy Chest Day"
                    value={this.props.title}
                    autoComplete="off"
                    style={{width: '100%', height: '40px', fontSize: '1.5rem', color: 'rgb(71, 71, 71)'}}
                    className={classes.TitleInput}
                    onChange={event => this.props.onUpdateTitle(event.target.value)}
                />
                <div className={classes.SelectBox}>
                    {/* To be gramatically correct, I check if the selected value is 'endurance' in order to place 'An' instead of 'A'. */}
                    <h2 className={classes.SelectPreview}>{this.props.select === 'Endurance' ? 'An' : 'A'} <span className={classes.SelectPreviewInput} style={{borderColor: colorsByDisplay(this.props.select).activeColor}}>{this.props.select}</span> Workout</h2>
                    <Select
                    labelId="demo-simple-select-placeholder-label-label" 
                    id="demo-simple-select-placeholder-label"
                    value={this.props.select}
                    onChange={this.props.onSelectHandler}
                    displayEmpty
                    color='primary'
                    className={classes.SelectInput}
                    style={{width: '100%', height: '40px', color: 'rgb(71, 71, 71)'}}
                    onChange={event => this.props.onUpdateSelect(event.target.value)}
                    >
                        <MenuItem value={'General'} selected>General</MenuItem>
                        <MenuItem value={'Powerlifting'} selected>Powerlifting</MenuItem>
                        <MenuItem value={'Bodybuilding'} selected>Bodybuilding</MenuItem>
                        <MenuItem value={'Weightlifting'} selected>Weightlifting</MenuItem>
                        <MenuItem value={'Endurance'} selected>Endurance</MenuItem>
                        <MenuItem value={'Crossfit'} selected>Crossfit</MenuItem>
                    </Select>
                    
                </div>

                {/* Stage 2 */}
                    
                <h2 style={{color: 'rgb(71, 71, 71)'}}>Exercises</h2>
                <div className={classes.NewExerciseBox}>
                    <TextField 
                        color='primary' 
                        id="standard-basic" 
                        label={"Exercise " + (this.props.exercises.length + 1)}
                        placeholder="e.g. Inline Bench Press"
                        autoComplete="off"
                        style={{width: '100%', height: '40px', fontSize: '1.5rem', color: 'rgb(71, 71, 71)', marginBottom: '40px'}}
                        className={classes.TitleInput}
                        value={this.state.currentExercise.title}
                        onChange={event => this.updateExerciseHandler(event, 'title')}
                    />
                    <RadioGroup 
                    aria-label="position" 
                    name="position" 
                    value={this.state.currentExercise.type} 
                    onChange={event => this.changeTypeHandler(event)} row
                    style={{marginBottom: '20px'}}
                    >
                        <FormControlLabel
                        value="sets-reps"
                        control={<Radio color="primary" />}
                        label="Sets-Reps"
                        labelPlacement="end"
                        />
                        <FormControlLabel
                        value="sets-min-sec"
                        control={<Radio color="primary" />}
                        label="Sets-Min-Sec"
                        labelPlacement="end"
                        />
                    </RadioGroup>

                    {inputsBasedOnFormat}

                    <button onClick={this.addExerciseHandler} className={classes.AddExerciseButton}>Add Exercise</button>

                    {this.state.errorMessages.length !== 0 ? 
                        <div>
                            <Dialog
                            open={this.state.errors.length !== 0}
                            >
                                <h2 className={classes.ErrorModalTitle}>Invalid Exercise</h2>
                                    
                                {this.state.errorMessages.map(errorMessage => {
                                    return <div style={{padding: '0 30px'}}>
                                        <ul className={classes.ErrorModalList}>
                                            <li className={classes.ErrorModalMessage}>{errorMessage}</li>
                                        </ul>
                                    </div>
                                })}
                                <DialogActions>
                                    <button className={classes.ErrorModalButton} onClick={this.closeErrorModalHandler}><CloseRoundedIcon fontSize="large"/></button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    : null}
                </div>
            </ThemeProvider>
        </div>
        
        <div className={classes.PreviewCardBox} style={this.props.exercises.length === 0 ? {position: 'relative', opacity: '0', top: '100px', transition: '0.2s ease-out'} : null}>
            {this.props.exercises.length > 0 ?
                <React.Fragment>
                    <h1 className={classes.PreviewCardTitle}>Preview</h1>
                    <PreviewCard deleteWorkout={this.openDeleteModalHandler} disableLike cardStyle={{width: '100%'}} workout={workout}/>
                </React.Fragment>
            : null}

        </div>
        <Dialog
            open={this.state.deleteWorkoutModal}
            >
                <div className={classes.DeleteModalBox}>
                    <h2 style={{color: 'rgb(71, 71, 71)', margin: '20px 40px 30px'}}>Are you sure you want to delete this workout?</h2>
                        <div className={classes.DeleteModalOptionBox}>
                            <button 
                            className={classes.DeleteModalOptionButton} 
                            onClick={this.deleteWorkoutHandler}
                            style={{color: 'rgb(130, 0, 0)', borderColor: 'rgb(130, 0, 0)'}}
                            >Yes</button>
                            <button 
                            className={classes.DeleteModalOptionButton} 
                            onClick={this.closeDeleteModalHandler}
                            style={{color: 'rgb(71, 71, 71)', borderColor: 'rgb(71, 71, 71)'}}
                            >No</button>
                        </div>
                </div>
            </Dialog>
        </React.Fragment>
    }
}

const mapStateToProps = state => {
    return {
        authorized: state.auth.authorized,
        title: state.create.title,
        select: state.create.select,
        exercises: state.create.exercises
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onUpdateTitle: title => dispatch({type: actionTypes.SET_TITLE, title: title}),
        onUpdateSelect: select => dispatch({type: actionTypes.SET_SELECT, select: select}),
        onAddExercise: exercise => dispatch({type: actionTypes.ADD_EXERCISE, exercise: exercise}),
        onDeleteExercise: id => dispatch({type: actionTypes.DELETE_EXERCISE, id: id}),
        onDeleteWorkout: () => dispatch({type: actionTypes.DELETE_WORKOUT})
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Create);