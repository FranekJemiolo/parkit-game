import { Engine } from './Engine.js';
import { InputSystem } from '../systems/InputSystem.js';
import { CarPhysicsSystem } from '../systems/CarPhysicsSystem.js';
import { ParkingSystem } from '../systems/ParkingSystem.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { SeasonSystem } from '../systems/SeasonSystem.js';
import { GarageSystem } from '../systems/GarageSystem.js';
import { DirectorSystem } from '../systems/DirectorSystem.js';
import { BalanceSystem } from '../systems/BalanceSystem.js';
import { ContentFactory } from '../systems/ContentFactory.js';
import { BossSystem } from '../systems/BossSystem.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { createRNG, lerp } from './utils.js';
import { GAME, DRIVETRAIN, CAR } from '../config/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.engine = null;
    this.timeElapsed = 0;
    this.gameState = 'playing'; // playing, won, failed
    this.difficulty = 0;
    this.currentSteerAngle = 0; // Current steering angle for gradual animation
    this.showBoundingBoxes = false; // Bounding boxes toggle (default OFF)
  }

  preload() {
    // Load BMW car assets
    this.load.image('bmw_m2', 'assets/packs/bmw_m2_topdown.png');
    this.load.image('bmw_5', 'assets/packs/bmw_5_topdown.png');
    this.load.image('bmw_wheel', 'assets/packs/bmw_wheel_topdown.png');
  }

  create() {
    // Initialize engine
    const seed = this.getSeedFromURL() || Date.now();
    this.engine = new Engine({ seed });
    
    // Register all systems
    this.engine
      .registerSystem(new InputSystem())
      .registerSystem(new CarPhysicsSystem())
      .registerSystem(new ParkingSystem())
      .registerSystem(new ScoringSystem())
      .registerSystem(new SeasonSystem())
      .registerSystem(new GarageSystem())
      .registerSystem(new DirectorSystem())
      .registerSystem(new BalanceSystem())
      .registerSystem(new ContentFactory())
      .registerSystem(new BossSystem())
      .registerSystem(new ReplaySystem())
      .registerSystem(new AudioSystem());
    
    // Initialize systems
    this.engine.init();
    
    // Setup game
    this.setupLevel();
    this.setupGraphics();
    this.setupUI();
    
    // Start replay recording
    const replay = this.engine.getSystem('ReplaySystem');
    replay.startRecording();
  }

  getSeedFromURL() {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    return seed ? parseInt(seed) : null;
  }

  setupLevel() {
    const rng = this.engine.rng;
    this.difficulty = Math.min(1, (this.engine.seed % 50) / GAME.LEVELS_TO_MAX_DIFFICULTY);
    
    // Generate parking lot layout
    this.parkingLotLayout = this.generateParkingLotLayout(rng);
    
    // Generate content
    const contentFactory = this.engine.getSystem('ContentFactory');
    const level = contentFactory.generateLevel(this.difficulty);
    
    // Apply car selection
    const garage = this.engine.getSystem('GarageSystem');
    const selectedDrivetrain = garage.getCurrentCar();
    const physics = this.engine.getSystem('CarPhysicsSystem');
    physics.setDrivetrain(selectedDrivetrain);
    
    // Select a target parking space from the layout
    const targetSpace = this.parkingLotLayout.parkingSpaces[Math.floor(rng() * this.parkingLotLayout.parkingSpaces.length)];
    
    // Generate parking spot (parallel to road with correct angle)
    const parking = this.engine.getSystem('ParkingSystem');
    parking.setParkingSpot({
      x: targetSpace.x,
      y: targetSpace.y,
      width: targetSpace.width,
      height: targetSpace.height,
      angle: targetSpace.angle // Use space angle (parallel to road)
    });
    
    // Set car start position (in the lane)
    const spot = parking.getParkingSpot();
    const lanePath = this.parkingLotLayout.lanePath;
    physics.resetCar({
      x: lanePath[0].x,
      y: lanePath[0].y,
      angle: 0
    });
    
    // Apply director modifiers
    const director = this.engine.getSystem('DirectorSystem');
    const directorMods = director.getModifiers();
    
    // Apply season modifiers
    const season = this.engine.getSystem('SeasonSystem');
    const seasonMods = season.getModifiers();
    
    // Apply through balance system
    const balance = this.engine.getSystem('BalanceSystem');
    balance.applyDirectorModifiers(directorMods);
    balance.applySeasonModifiers(seasonMods);
    balance.applyTuning();
    
    // Activate boss if applicable
    const boss = this.engine.getSystem('BossSystem');
    if (level.boss) {
      boss.activateBoss(level.boss);
    }
    
    // Reset scoring
    const scoring = this.engine.getSystem('ScoringSystem');
    scoring.reset(130 + this.difficulty * 90);
    scoring.setDrivetrainMultiplier(selectedDrivetrain);
    
    // Reset state
    this.timeElapsed = 0;
    this.gameState = 'playing';
    
    // Store obstacle data for generation (only in parking spaces)
    this.obstacleData = this.generateObstacles(spot, rng);
  }
  
  generateParkingLotLayout(rng) {
    // Define parking lot layout
    const laneWidth = 100;
    // Randomize space dimensions around 1.25x car size (car: WIDTH=25, LENGTH=50)
    const spaceWidth = 60 + rng() * 15; // 60-75 (1.2x-1.5x car length)
    const spaceHeight = 30 + rng() * 10; // 30-40 (1.2x-1.6x car width)
    const spaceGap = 20;
    
    // Generate random road layout with curves and intersections
    const roadLayout = this.generateRandomRoadLayout(rng);
    const lanePath = roadLayout.path;
    const laneCenterY = roadLayout.centerY;
    
    // Helper function to get road angle at a given X position
    const getRoadAngle = (x) => {
      // Find the segment the X position falls on
      for (let i = 0; i < lanePath.length - 1; i++) {
        const p1 = lanePath[i];
        const p2 = lanePath[i + 1];
        
        if (x >= p1.x && x <= p2.x) {
          return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        }
      }
      return 0; // Default horizontal
    };
    
    // Helper function to get road Y position at a given X position
    const getRoadY = (x) => {
      // Find the segment the X position falls on
      for (let i = 0; i < lanePath.length - 1; i++) {
        const p1 = lanePath[i];
        const p2 = lanePath[i + 1];
        
        if (x >= p1.x && x <= p2.x) {
          const t = (x - p1.x) / (p2.x - p1.x);
          return p1.y + t * (p2.y - p1.y);
        }
      }
      return laneCenterY; // Default
    };
    
    // Helper function to calculate spacing based on rotation
    const getSpacingForAngle = (angle) => {
      // Calculate effective width after rotation
      const effectiveWidth = Math.abs(spaceWidth * Math.cos(angle)) + Math.abs(spaceHeight * Math.sin(angle));
      return effectiveWidth + spaceGap;
    };
    
    // Generate parking spaces on both sides of the lane (parallel parking)
    const parkingSpaces = [];
    const numSpacesPerRow = 8; // Increased to cover full road length
    
    // Calculate positions with proper spacing based on rotation
    let currentX = 100;
    
    // Initialize angle tracking for consistency
    let previousAngleOffset = null;
    
    // Top row of parking spaces (parallel to lane, adjacent to road edge)
    for (let i = 0; i < numSpacesPerRow; i++) {
      const roadAngle = getRoadAngle(currentX);
      const roadY = getRoadY(currentX);
      const spacing = getSpacingForAngle(roadAngle);
      
      // Calculate extra offset for curved sections to prevent overlap
      const curveOffset = Math.abs(Math.sin(roadAngle)) * 20; // Extra offset when curved
      
      // Determine angle offset with consistency
      let angleOffsetDegrees;
      if (previousAngleOffset === null) {
        // First space: random angle
        const angleType = Math.floor(rng() * 4);
        if (angleType === 0) {
          angleOffsetDegrees = 0; // Parallel to road
        } else if (angleType === 1) {
          angleOffsetDegrees = Math.PI / 4; // 45 degrees
        } else if (angleType === 2) {
          angleOffsetDegrees = Math.PI / 2; // 90 degrees
        } else {
          angleOffsetDegrees = rng() * Math.PI / 2; // Random 0-90 degrees
        }
      } else {
        // Consistent with previous angle ±10 degrees
        const variance = (rng() - 0.5) * (Math.PI / 18); // ±10 degrees in radians
        angleOffsetDegrees = previousAngleOffset + variance;
        // Clamp to 0-90 degrees
        angleOffsetDegrees = Math.max(0, Math.min(Math.PI / 2, angleOffsetDegrees));
      }
      
      previousAngleOffset = angleOffsetDegrees;
      
      // Calculate extra offset for angled spots to prevent road overlap
      // When rotated, the effective height perpendicular to road increases
      const effectiveHeightOffset = Math.abs(Math.sin(angleOffsetDegrees)) * spaceHeight * 0.5;
      
      parkingSpaces.push({
        x: currentX,
        y: roadY - laneWidth / 2 - spaceHeight / 2 - curveOffset - effectiveHeightOffset, // Extra offset for curves and angles
        width: spaceWidth,
        height: spaceHeight,
        angle: roadAngle + angleOffsetDegrees, // Road angle plus random offset
        occupied: false
      });
      
      currentX += spacing;
    }
    
    // Reset for bottom row
    currentX = 100;
    previousAngleOffset = null;
    
    // Bottom row of parking spaces (parallel to lane, adjacent to road edge)
    for (let i = 0; i < numSpacesPerRow; i++) {
      const roadAngle = getRoadAngle(currentX);
      const roadY = getRoadY(currentX);
      const spacing = getSpacingForAngle(roadAngle);
      
      // Calculate extra offset for curved sections to prevent overlap
      const curveOffset = Math.abs(Math.sin(roadAngle)) * 20; // Extra offset when curved
      
      // Determine angle offset with consistency
      let angleOffsetDegrees;
      if (previousAngleOffset === null) {
        // First space: random angle
        const angleType = Math.floor(rng() * 4);
        if (angleType === 0) {
          angleOffsetDegrees = 0; // Parallel to road
        } else if (angleType === 1) {
          angleOffsetDegrees = Math.PI / 4; // 45 degrees
        } else if (angleType === 2) {
          angleOffsetDegrees = Math.PI / 2; // 90 degrees
        } else {
          angleOffsetDegrees = rng() * Math.PI / 2; // Random 0-90 degrees
        }
      } else {
        // Consistent with previous angle ±10 degrees
        const variance = (rng() - 0.5) * (Math.PI / 18); // ±10 degrees in radians
        angleOffsetDegrees = previousAngleOffset + variance;
        // Clamp to 0-90 degrees
        angleOffsetDegrees = Math.max(0, Math.min(Math.PI / 2, angleOffsetDegrees));
      }
      
      previousAngleOffset = angleOffsetDegrees;
      
      // Calculate extra offset for angled spots to prevent road overlap
      // When rotated, the effective height perpendicular to road increases
      const effectiveHeightOffset = Math.abs(Math.sin(angleOffsetDegrees)) * spaceHeight * 0.5;
      
      parkingSpaces.push({
        x: currentX,
        y: roadY + laneWidth / 2 + spaceHeight / 2 + curveOffset + effectiveHeightOffset, // Extra offset for curves and angles
        width: spaceWidth,
        height: spaceHeight,
        angle: roadAngle + angleOffsetDegrees, // Road angle plus random offset
        occupied: false
      });
      
      currentX += spacing;
    }
    
    // Define lane boundaries as points along the path
    const laneBoundaries = {
      top: [],
      bottom: []
    };
    
    for (const point of lanePath) {
      laneBoundaries.top.push({ x: point.x, y: point.y - laneWidth / 2 });
      laneBoundaries.bottom.push({ x: point.x, y: point.y + laneWidth / 2 });
    }
    
    // Define interesting-shaped buildings (L-shaped, T-shaped, etc.)
    const buildings = [
      // L-shaped building top left
      { x: 60, y: 20, width: 100, height: 60 },
      { x: 60, y: 80, width: 40, height: 40 },
      // T-shaped building top middle
      { x: 200, y: 20, width: 80, height: 60 },
      { x: 220, y: 80, width: 40, height: 40 },
      // L-shaped building top right
      { x: 500, y: 20, width: 100, height: 60 },
      { x: 560, y: 80, width: 40, height: 40 },
      // T-shaped building bottom left
      { x: 60, y: 480, width: 80, height: 60 },
      { x: 80, y: 540, width: 40, height: 40 },
      // L-shaped building bottom middle
      { x: 250, y: 480, width: 100, height: 60 },
      { x: 250, y: 540, width: 40, height: 40 },
      // T-shaped building bottom right
      { x: 520, y: 480, width: 80, height: 60 },
      { x: 540, y: 540, width: 40, height: 40 }
    ];
    
    // Add trees between parking spaces
    const trees = [];
    const treeWidth = 15;
    const treeHeight = 15;
    
    // Calculate tree positions between spaces
    let treeX = 100 + (spaceWidth + spaceGap) / 2; // Position between first and second space
    
    for (let i = 0; i < numSpacesPerRow - 1; i++) {
      const roadAngle = getRoadAngle(treeX);
      const roadY = getRoadY(treeX);
      const curveOffset = Math.abs(Math.sin(roadAngle)) * 20; // Same curve offset as spaces
      
      // Trees need extra offset to account for angled parking spaces
      // Use maximum possible angle offset (90 degrees) for trees
      const maxAngleOffset = Math.sin(Math.PI / 2) * spaceHeight * 0.5;
      
      // Trees follow road angle (not parking space angle)
      trees.push({
        x: treeX,
        y: roadY - laneWidth / 2 - spaceHeight / 2 - 20 - curveOffset - maxAngleOffset, // Follow road curve with offset
        width: treeWidth,
        height: treeHeight,
        angle: roadAngle,
        type: 'tree'
      });
      
      // Bottom row trees
      trees.push({
        x: treeX,
        y: roadY + laneWidth / 2 + spaceHeight / 2 + 20 + curveOffset + maxAngleOffset, // Follow road curve with offset
        width: treeWidth,
        height: treeHeight,
        angle: roadAngle,
        type: 'tree'
      });
      
      // Move to next gap
      const spacing = getSpacingForAngle(roadAngle);
      treeX += spacing;
    }
    
    return {
      laneWidth,
      laneCenterY,
      lanePath,
      laneBoundaries,
      parkingSpaces,
      buildings,
      trees
    };
  }
  
  generateRandomRoadLayout(rng) {
    // Generate random road layout with curves and intersections
    const layoutType = Math.floor(rng() * 3); // 0: straight with gentle curves, 1: gentle S-curve, 2: gentle intersection
    
    let path;
    let centerY = 300;
    
    if (layoutType === 0) {
      // Straight with gentle curves - max 45 degrees
      const maxCurveY = Math.tan(Math.PI / 4) * 250; // 45 degrees over 250px = 250px
      const curveAmount = (rng() - 0.5) * maxCurveY;
      path = [
        { x: 50, y: centerY },
        { x: 200, y: centerY },
        { x: 350, y: centerY + curveAmount * 0.5 }, // Gradual transition
        { x: 500, y: centerY + curveAmount },
        { x: 650, y: centerY + curveAmount * 0.5 }, // Gradual transition back
        { x: 750, y: centerY }
      ];
    } else if (layoutType === 1) {
      // Gentle S-curve - max 45 degrees per segment
      const maxCurveY = Math.tan(Math.PI / 4) * 150; // 45 degrees over 150px = 150px
      const curve1 = (rng() - 0.5) * maxCurveY;
      const curve2 = (rng() - 0.5) * maxCurveY;
      path = [
        { x: 50, y: centerY },
        { x: 200, y: centerY + curve1 * 0.5 }, // Gradual
        { x: 400, y: centerY + curve1 + curve2 },
        { x: 600, y: centerY + curve2 * 0.5 }, // Gradual
        { x: 750, y: centerY }
      ];
    } else {
      // Gentle intersection (T-junction) - max 45 degrees
      const intersectionX = 350 + Math.floor(rng() * 100); // More centered
      const maxIntersectionY = Math.tan(Math.PI / 4) * 100; // 45 degrees over 100px = 100px
      const intersectionY = centerY + (rng() - 0.5) * maxIntersectionY;
      path = [
        { x: 50, y: centerY },
        { x: intersectionX - 50, y: centerY }, // Approach point
        { x: intersectionX, y: centerY },
        { x: intersectionX, y: intersectionY },
        { x: intersectionX + 50, y: intersectionY }, // Exit point
        { x: 750, y: intersectionY }
      ];
      centerY = (centerY + intersectionY) / 2; // Average Y for parking spaces
    }
    
    return { path, centerY };
  }
  
  generateObstacles(spot, rng) {
    const obstacles = [];
    // Fill 75% of available spaces
    const fillRatio = 0.75;
    const numObstacles = Math.floor(this.parkingLotLayout.parkingSpaces.length * fillRatio);
    
    // Get available parking spaces (not the target spot)
    const availableSpaces = this.parkingLotLayout.parkingSpaces.filter(space => 
      !(space.x === spot.x && space.y === spot.y)
    );
    
    // Shuffle available spaces
    for (let i = availableSpaces.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [availableSpaces[i], availableSpaces[j]] = [availableSpaces[j], availableSpaces[i]];
    }
    
    // Place obstacles in parking spaces (parallel to road with correct angle)
    for (let i = 0; i < Math.min(numObstacles, availableSpaces.length); i++) {
      const space = availableSpaces[i];
      // Use consistent dimensions for collision (based on car size)
      const carWidth = 25; // Consistent car width
      const carLength = 50; // Consistent car length
      
      // Add random offset within the parking space for variety
      const offsetX = (rng() - 0.5) * 10; // -5 to +5 pixels
      const offsetY = (rng() - 0.5) * 6; // -3 to +3 pixels
      
      obstacles.push({
        x: space.x + offsetX,
        y: space.y + offsetY,
        width: carLength, // Car length along road
        height: carWidth, // Car width perpendicular to road
        angle: space.angle // Use space angle (parallel to road)
      });
    }
    
    return obstacles;
  }

  setupGraphics() {
    // Asphalt background
    this.add.rectangle(400, 300, 800, 600, 0x333333);
    
    // Draw buildings (interesting shapes - multiple rectangles)
    for (const building of this.parkingLotLayout.buildings) {
      this.add.rectangle(
        building.x + building.width / 2,
        building.y + building.height / 2,
        building.width,
        building.height,
        0x555555
      ).setStrokeStyle(3, 0x222222);
    }
    
    // Draw trees (green rectangles between spaces)
    if (this.parkingLotLayout.trees) {
      for (const tree of this.parkingLotLayout.trees) {
        const treeRect = this.add.rectangle(
          tree.x, tree.y, tree.width, tree.height,
          0x228822
        ).setStrokeStyle(2, 0x004400);
        treeRect.setRotation(tree.angle);
      }
    }
    
    // Draw lane using graphics for smooth curves
    const lanePath = this.parkingLotLayout.lanePath;
    const laneWidth = this.parkingLotLayout.laneWidth;
    const graphics = this.add.graphics();
    
    // Draw lane fill (thick line along path)
    graphics.lineStyle(laneWidth, 0x444444, 1);
    graphics.beginPath();
    graphics.moveTo(lanePath[0].x, lanePath[0].y);
    for (let i = 1; i < lanePath.length; i++) {
      graphics.lineTo(lanePath[i].x, lanePath[i].y);
    }
    graphics.strokePath();
    
    // Draw lane boundaries (thin yellow lines)
    graphics.lineStyle(2, 0xffff00, 1);
    
    // Top boundary
    graphics.beginPath();
    for (let i = 0; i < lanePath.length; i++) {
      const point = lanePath[i];
      const boundaryY = point.y - laneWidth / 2;
      if (i === 0) {
        graphics.moveTo(point.x, boundaryY);
      } else {
        graphics.lineTo(point.x, boundaryY);
      }
    }
    graphics.strokePath();
    
    // Bottom boundary
    graphics.beginPath();
    for (let i = 0; i < lanePath.length; i++) {
      const point = lanePath[i];
      const boundaryY = point.y + laneWidth / 2;
      if (i === 0) {
        graphics.moveTo(point.x, boundaryY);
      } else {
        graphics.lineTo(point.x, boundaryY);
      }
    }
    graphics.strokePath();
    
    // Draw lane center line (dashed)
    graphics.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < lanePath.length - 1; i++) {
      const p1 = lanePath[i];
      const p2 = lanePath[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const segments = Math.floor(dist / 25);
      
      for (let j = 0; j < segments; j++) {
        const t1 = j / segments;
        const t2 = (j + 0.5) / segments;
        const x1 = p1.x + dx * t1;
        const y1 = p1.y + dy * t1;
        const x2 = p1.x + dx * t2;
        const y2 = p1.y + dy * t2;
        
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
      }
    }
    
    // Draw all parking spaces with correct rotation
    for (const space of this.parkingLotLayout.parkingSpaces) {
      // Space outline
      const spaceRect = this.add.rectangle(
        space.x, space.y, space.width, space.height,
        0x000000, 0
      );
      spaceRect.setStrokeStyle(2, 0xffffff);
      spaceRect.setRotation(space.angle);
    }
    
    // Highlight target parking spot
    const parking = this.engine.getSystem('ParkingSystem');
    const spot = parking.getParkingSpot();
    this.parkingSpotGraphics = this.add.rectangle(
      spot.x, spot.y, spot.width, spot.height,
      0x00ff00, 0.2
    );
    this.parkingSpotGraphics.setStrokeStyle(3, 0x00ff00);
    this.parkingSpotGraphics.setRotation(spot.angle);
    
    // Add FRONT and BACK text to indicate parking direction
    const textOffset = spot.width / 2 - 10;
    const frontX = spot.x + Math.cos(spot.angle) * textOffset;
    const frontY = spot.y + Math.sin(spot.angle) * textOffset;
    const backX = spot.x - Math.cos(spot.angle) * textOffset;
    const backY = spot.y - Math.sin(spot.angle) * textOffset;
    
    // FRONT text (white, smaller, rotated 90 degrees)
    const frontText = this.add.text(frontX, frontY, 'FRONT', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    frontText.setRotation(spot.angle + Math.PI / 2); // Rotate 90 degrees
    
    // BACK text (white, smaller, rotated 90 degrees)
    const backText = this.add.text(backX, backY, 'BACK', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    backText.setRotation(spot.angle + Math.PI / 2); // Rotate 90 degrees
    
    // Player car sprite (BMW M2)
    const physics = this.engine.getSystem('CarPhysicsSystem');
    const carState = physics.getCarState();
    this.carGraphics = this.add.sprite(carState.x, carState.y, 'bmw_m2');
    this.carGraphics.setScale(0.18); // Increased scale for larger parking spaces
    this.carGraphics.setRotation(Math.PI / 2); // Rotate 90 degrees to face right (sprite faces up, physics angle 0 is right)
    this.carGraphics.setDepth(1); // Render above wheels
    
    // Create 4 wheels for the player car
    const wheelScale = 0.02373046875; // 25% smaller (0.031640625 * 0.75)
    
    // Calculate car sprite dimensions after scaling
    const carWidth = this.carGraphics.width * this.carGraphics.scaleX;
    const carHeight = this.carGraphics.height * this.carGraphics.scaleY;
    
    // Position wheels closer to center in width, farther in height
    // Car faces right (angle 0 = right in physics, sprite rotated 90°)
    // Y axis = front/back, X axis = left/right in sprite coordinates
    // Front wheels at 20% from front (negative Y)
    // Rear wheels at 20% from back (positive Y)
    const frontOffset = -carHeight / 2 + (carHeight * 0.20); // 20% from front
    const rearOffset = carHeight / 2 - (carHeight * 0.20); // 20% from back
    const sideOffset = carWidth / 2 * 0.8; // 80% of half-width (slightly more to sides)
    
    // Store wheel offsets for positioning
    // X offset = left/right position, Y offset = front/back position
    this.wheelOffsets = {
      frontLeft: { x: -sideOffset, y: frontOffset },
      frontRight: { x: sideOffset, y: frontOffset },
      rearLeft: { x: -sideOffset, y: rearOffset },
      rearRight: { x: sideOffset, y: rearOffset }
    };
    
    // Front wheels (will rotate when steering)
    this.wheelFrontLeft = this.add.sprite(carState.x, carState.y, 'bmw_wheel');
    this.wheelFrontLeft.setScale(wheelScale);
    this.wheelFrontLeft.setRotation(Math.PI / 2);
    this.wheelFrontLeft.setDepth(0); // Render below car
    
    this.wheelFrontRight = this.add.sprite(carState.x, carState.y, 'bmw_wheel');
    this.wheelFrontRight.setScale(wheelScale);
    this.wheelFrontRight.setRotation(Math.PI / 2);
    this.wheelFrontRight.setDepth(0); // Render below car
    
    // Rear wheels (don't rotate with steering)
    this.wheelRearLeft = this.add.sprite(carState.x, carState.y, 'bmw_wheel');
    this.wheelRearLeft.setScale(wheelScale);
    this.wheelRearLeft.setRotation(Math.PI / 2);
    this.wheelRearLeft.setDepth(0); // Render below car
    
    this.wheelRearRight = this.add.sprite(carState.x, carState.y, 'bmw_wheel');
    this.wheelRearRight.setScale(wheelScale);
    this.wheelRearRight.setRotation(Math.PI / 2);
    this.wheelRearRight.setDepth(0); // Render below car
    
    // Obstacles (parked cars) - use BMW 5
    this.obstacles = [];
    for (const obsData of this.obstacleData) {
      const obs = this.add.sprite(obsData.x, obsData.y, 'bmw_5');
      // Use consistent scale for all cars
      obs.setScale(0.18);
      obs.setRotation(obsData.angle + Math.PI / 2); // Use obstacle angle + sprite offset
      this.obstacles.push(obs);
    }
    
    // Draw bounding boxes
    this.drawBoundingBoxes();
  }
  
  drawBoundingBoxes() {
    // Draw player car bounding box (rotated)
    const carWidth = this.carGraphics.width * this.carGraphics.scaleX;
    const carHeight = this.carGraphics.height * this.carGraphics.scaleY;
    const carAngle = this.carGraphics.rotation;
    const carCorners = this.getRotatedCorners(this.carGraphics.x, this.carGraphics.y, carWidth, carHeight, carAngle);
    
    const carBox = this.add.graphics();
    carBox.lineStyle(2, 0xffa500); // Orange
    carBox.beginPath();
    carBox.moveTo(carCorners[0].x, carCorners[0].y);
    for (let i = 1; i < carCorners.length; i++) {
      carBox.lineTo(carCorners[i].x, carCorners[i].y);
    }
    carBox.closePath();
    carBox.strokePath();
    carBox.setVisible(false); // Hidden by default
    this.carBoundingBoxGraphics = carBox;
    
    // Draw obstacle bounding boxes (rotated)
    this.obstacleBoundingBoxGraphics = [];
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      // Use sprite visual dimensions for bounding box to match what you see
      const obsWidth = obs.width * obs.scaleX;
      const obsHeight = obs.height * obs.scaleY;
      const obsAngle = obs.rotation;
      const obsCorners = this.getRotatedCorners(obs.x, obs.y, obsWidth, obsHeight, obsAngle);
      
      const obsBox = this.add.graphics();
      obsBox.lineStyle(2, 0xffa500); // Orange
      obsBox.beginPath();
      obsBox.moveTo(obsCorners[0].x, obsCorners[0].y);
      for (let j = 1; j < obsCorners.length; j++) {
        obsBox.lineTo(obsCorners[j].x, obsCorners[j].y);
      }
      obsBox.closePath();
      obsBox.strokePath();
      obsBox.setVisible(false); // Hidden by default
      this.obstacleBoundingBoxGraphics.push(obsBox);
    }
  }
  
  updateBoundingBoxes() {
    // Update player car bounding box (rotated)
    const carWidth = this.carGraphics.width * this.carGraphics.scaleX;
    const carHeight = this.carGraphics.height * this.carGraphics.scaleY;
    const carAngle = this.carGraphics.rotation;
    const carCorners = this.getRotatedCorners(this.carGraphics.x, this.carGraphics.y, carWidth, carHeight, carAngle);
    
    this.carBoundingBoxGraphics.clear();
    this.carBoundingBoxGraphics.lineStyle(2, 0xffa500); // Orange
    this.carBoundingBoxGraphics.beginPath();
    this.carBoundingBoxGraphics.moveTo(carCorners[0].x, carCorners[0].y);
    for (let i = 1; i < carCorners.length; i++) {
      this.carBoundingBoxGraphics.lineTo(carCorners[i].x, carCorners[i].y);
    }
    this.carBoundingBoxGraphics.closePath();
    this.carBoundingBoxGraphics.strokePath();
    
    // Update obstacle bounding boxes (rotated)
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      // Use sprite visual dimensions for bounding box to match what you see
      const obsWidth = obs.width * obs.scaleX;
      const obsHeight = obs.height * obs.scaleY;
      const obsAngle = obs.rotation;
      const obsCorners = this.getRotatedCorners(obs.x, obs.y, obsWidth, obsHeight, obsAngle);
      
      this.obstacleBoundingBoxGraphics[i].clear();
      this.obstacleBoundingBoxGraphics[i].lineStyle(2, 0xffa500); // Orange
      this.obstacleBoundingBoxGraphics[i].beginPath();
      this.obstacleBoundingBoxGraphics[i].moveTo(obsCorners[0].x, obsCorners[0].y);
      for (let j = 1; j < obsCorners.length; j++) {
        this.obstacleBoundingBoxGraphics[i].lineTo(obsCorners[j].x, obsCorners[j].y);
      }
      this.obstacleBoundingBoxGraphics[i].closePath();
      this.obstacleBoundingBoxGraphics[i].strokePath();
    }
  }

  updateBoundingBoxVisibility() {
    // Toggle car bounding box visibility
    this.carBoundingBoxGraphics.setVisible(this.showBoundingBoxes);
    
    // Toggle obstacle bounding boxes visibility
    for (const obsBox of this.obstacleBoundingBoxGraphics) {
      obsBox.setVisible(this.showBoundingBoxes);
    }
  }
  
  setupUI() {
    // Score display
    this.scoreText = this.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 10 }
    });
    
    // Debug info
    const parking = this.engine.getSystem('ParkingSystem');
    const spot = parking.getParkingSpot();
    this.add.text(10, 40, `Target: (${spot.x.toFixed(0)}, ${spot.y.toFixed(0)}) angle: ${(spot.angle * 180 / Math.PI).toFixed(1)}°`, {
      fontSize: '14px',
      color: '#ffff00',
      backgroundColor: 'rgba(0,0,0,0.5)'
    });
    
    this.add.text(10, 60, `Obstacles: ${this.obstacleData.length}`, {
      fontSize: '14px',
      color: '#ffff00',
      backgroundColor: 'rgba(0,0,0,0.5)'
    });
    
    // Instructions
    this.add.text(400, 580, 'Arrow Keys / WASD to drive | SHIFT to brake | R to restart | SPACE for parking brake', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Parking brake button
    this.parkingBrakeButton = this.add.text(700, 30, 'PARK', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 20, y: 10 },
      fixedWidth: 80,
      align: 'center'
    }).setOrigin(0.5);
    this.parkingBrakeButton.setInteractive({ useHandCursor: true });
    this.parkingBrakeButton.on('pointerdown', () => this.triggerParkingBrake());
    
    // Parking brake key shortcut
    this.input.keyboard.on('keydown-SPACE', () => this.triggerParkingBrake());
    
    // Result overlay (hidden initially)
    this.resultOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    this.resultOverlay.setVisible(false);
    
    this.resultText = this.add.text(400, 300, '', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    this.resultText.setVisible(false);
    
    // Restart key - use regular listener for multiple restarts
    this.input.keyboard.on('keydown-R', () => this.restart());
    
    // Toggle bounding boxes with B key
    this.input.keyboard.on('keydown-B', () => {
      this.showBoundingBoxes = !this.showBoundingBoxes;
      this.updateBoundingBoxVisibility();
    });
  }

  update(time, delta) {
    if (this.gameState !== 'playing') return;
    
    const dt = delta / 1000;
    this.timeElapsed += dt;
    
    // Get input
    const inputSystem = this.engine.getSystem('InputSystem');
    const input = inputSystem.getInput();
    
    // Track moves
    if (inputSystem.hasChanged()) {
      const scoring = this.engine.getSystem('ScoringSystem');
      scoring.incrementMove();
      inputSystem.snapshot();
    }
    
    // Update physics
    const physics = this.engine.getSystem('CarPhysicsSystem');
    physics.update(dt, input);
    
    // Update fuel
    const scoring = this.engine.getSystem('ScoringSystem');
    const carState = physics.getCarState();
    scoring.updateFuel(carState, input, dt);
    
    // Record replay
    const replay = this.engine.getSystem('ReplaySystem');
    replay.recordInput(input);
    
    // Check win/lose conditions
    this.checkGameEnd();
    
    // Update graphics
    this.updateGraphics();
    
    // Update UI (every 10 frames for performance)
    if (time % 10 < 20) {
      this.updateUI();
    }
    
    // Check fuel
    if (scoring.getStats().fuel <= 0) {
      this.endGame(false);
    }
  }

  checkGameEnd() {
    const physics = this.engine.getSystem('CarPhysicsSystem');
    const carState = physics.getCarState();
    
    // Check collision with obstacles
    for (const obs of this.obstacles) {
      if (this.checkCollision(carState, obs)) {
        this.endGame(false);
        return;
      }
    }
    
    // Check collision with lane boundaries
    if (this.checkLaneBoundaryCollision(carState)) {
      this.endGame(false);
      return;
    }
    
    // Automatic parking detection removed - player must use parking brake (PARK button or SPACE)
  }
  
  checkLaneBoundaryCollision(car) {
    const lanePath = this.parkingLotLayout.lanePath;
    const laneWidth = this.parkingLotLayout.laneWidth;
    const laneCenterY = this.parkingLotLayout.laneCenterY;
    
    // Check if car is in building areas (stricter check with margin)
    for (const building of this.parkingLotLayout.buildings) {
      const margin = 10;
      if (car.x > building.x - margin && 
          car.x < building.x + building.width + margin &&
          car.y > building.y - margin && 
          car.y < building.y + building.height + margin) {
        return true;
      }
    }
    
    // Check if car hits trees
    if (this.parkingLotLayout.trees) {
      for (const tree of this.parkingLotLayout.trees) {
        const margin = 5;
        if (car.x > tree.x - tree.width / 2 - margin && 
            car.x < tree.x + tree.width / 2 + margin &&
            car.y > tree.y - tree.height / 2 - margin && 
            car.y < tree.y + tree.height / 2 + margin) {
          return true;
        }
      }
    }
    
    // Check screen bounds
    if (car.x < 20 || car.x > 780 || car.y < 20 || car.y > 580) {
      return true;
    }
    
    // Allow car to be anywhere except buildings, trees, and screen bounds
    // Parking spaces and areas around them are allowed
    return false;
  }

  checkCollision(car, obstacle) {
    // Get car sprite dimensions and rotation
    const carWidth = this.carGraphics.width * this.carGraphics.scaleX;
    const carHeight = this.carGraphics.height * this.carGraphics.scaleY;
    const carAngle = this.carGraphics.rotation;
    
    // Get obstacle sprite visual dimensions (matches bounding box)
    const obsWidth = obstacle.width * obstacle.scaleX;
    const obsHeight = obstacle.height * obstacle.scaleY;
    const obsAngle = obstacle.rotation;
    
    // Calculate rotated corners for car
    const carCorners = this.getRotatedCorners(car.x, car.y, carWidth, carHeight, carAngle);
    
    // Calculate rotated corners for obstacle
    const obsCorners = this.getRotatedCorners(obstacle.x, obstacle.y, obsWidth, obsHeight, obsAngle);
    
    // Use separating axis theorem for rotated rectangle collision
    return this.checkRotatedCollision(carCorners, obsCorners);
  }
  
  getRotatedCorners(x, y, width, height, angle) {
    const halfW = width / 2;
    const halfH = height / 2;
    
    // Unrotated corners (relative to center)
    const corners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH }
    ];
    
    // Rotate and translate corners
    return corners.map(corner => ({
      x: x + corner.x * Math.cos(angle) - corner.y * Math.sin(angle),
      y: y + corner.x * Math.sin(angle) + corner.y * Math.cos(angle)
    }));
  }
  
  checkRotatedCollision(corners1, corners2) {
    // Separating axis theorem
    const axes = [];
    
    // Get axes from first rectangle
    for (let i = 0; i < 4; i++) {
      const p1 = corners1[i];
      const p2 = corners1[(i + 1) % 4];
      axes.push({
        x: p2.y - p1.y,
        y: p1.x - p2.x
      });
    }
    
    // Get axes from second rectangle
    for (let i = 0; i < 4; i++) {
      const p1 = corners2[i];
      const p2 = corners2[(i + 1) % 4];
      axes.push({
        x: p2.y - p1.y,
        y: p1.x - p2.x
      });
    }
    
    // Normalize axes
    for (const axis of axes) {
      const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
      if (len > 0) {
        axis.x /= len;
        axis.y /= len;
      }
    }
    
    // Check for separating axis
    for (const axis of axes) {
      let min1 = Infinity, max1 = -Infinity;
      let min2 = Infinity, max2 = -Infinity;
      
      for (const corner of corners1) {
        const proj = corner.x * axis.x + corner.y * axis.y;
        min1 = Math.min(min1, proj);
        max1 = Math.max(max1, proj);
      }
      
      for (const corner of corners2) {
        const proj = corner.x * axis.x + corner.y * axis.y;
        min2 = Math.min(min2, proj);
        max2 = Math.max(max2, proj);
      }
      
      if (max1 < min2 || max2 < min1) {
        return false; // Separating axis found
      }
    }
    
    return true; // No separating axis, collision detected
  }

  updateGraphics() {
    const physics = this.engine.getSystem('CarPhysicsSystem');
    const carState = physics.getCarState();
    const inputSystem = this.engine.getSystem('InputSystem');
    const input = inputSystem.getInput();
    
    // Update car position and rotation (add PI/2 offset for sprite orientation)
    this.carGraphics.setPosition(carState.x, carState.y);
    this.carGraphics.rotation = carState.angle + Math.PI / 2;
    
    // Update wheel steering angle in physics system
    physics.setWheelSteeringAngle(this.currentSteerAngle);
    
    // Update wheel positions based on car position and rotation
    const carRotation = carState.angle + Math.PI / 2;
    
    // Calculate wheel positions using rotation
    const cos = Math.cos(carRotation);
    const sin = Math.sin(carRotation);
    
    // Front left wheel
    const flX = carState.x + (this.wheelOffsets.frontLeft.x * cos - this.wheelOffsets.frontLeft.y * sin);
    const flY = carState.y + (this.wheelOffsets.frontLeft.x * sin + this.wheelOffsets.frontLeft.y * cos);
    this.wheelFrontLeft.setPosition(flX, flY);
    
    // Front right wheel
    const frX = carState.x + (this.wheelOffsets.frontRight.x * cos - this.wheelOffsets.frontRight.y * sin);
    const frY = carState.y + (this.wheelOffsets.frontRight.x * sin + this.wheelOffsets.frontRight.y * cos);
    this.wheelFrontRight.setPosition(frX, frY);
    
    // Rear left wheel
    const rlX = carState.x + (this.wheelOffsets.rearLeft.x * cos - this.wheelOffsets.rearLeft.y * sin);
    const rlY = carState.y + (this.wheelOffsets.rearLeft.x * sin + this.wheelOffsets.rearLeft.y * cos);
    this.wheelRearLeft.setPosition(rlX, rlY);
    
    // Rear right wheel
    const rrX = carState.x + (this.wheelOffsets.rearRight.x * cos - this.wheelOffsets.rearRight.y * sin);
    const rrY = carState.y + (this.wheelOffsets.rearRight.x * sin + this.wheelOffsets.rearRight.y * cos);
    this.wheelRearRight.setPosition(rrX, rrY);
    
    // Update wheel rotations - rear wheels follow car, front wheels rotate with steering
    this.wheelRearLeft.rotation = carRotation;
    this.wheelRearRight.rotation = carRotation;
    
    // Front wheel steering - gradual animation
    const maxSteerAngle = 40 * Math.PI / 180; // 40 degrees in radians
    const steerSpeed = 10; // Speed of steering animation (radians per second)
    const dt = 1 / 60; // Assume 60fps for steering animation
    
    let targetSteerAngle = this.currentSteerAngle; // Default: keep current angle
    
    if (input.left) {
      targetSteerAngle = -maxSteerAngle;
    } else if (input.right) {
      targetSteerAngle = maxSteerAngle;
    }
    
    // Gradually interpolate current steering angle towards target
    if (this.currentSteerAngle < targetSteerAngle) {
      this.currentSteerAngle = Math.min(this.currentSteerAngle + steerSpeed * dt, targetSteerAngle);
    } else if (this.currentSteerAngle > targetSteerAngle) {
      this.currentSteerAngle = Math.max(this.currentSteerAngle - steerSpeed * dt, targetSteerAngle);
    }
    
    // Front wheels rotate with car angle plus steering
    this.wheelFrontLeft.rotation = carRotation + this.currentSteerAngle;
    this.wheelFrontRight.rotation = carRotation + this.currentSteerAngle;
    
    // Update bounding boxes
    this.updateBoundingBoxes();
  }

  updateUI() {
    const scoring = this.engine.getSystem('ScoringSystem');
    const stats = scoring.getStats();
    const director = this.engine.getSystem('DirectorSystem');
    const season = this.engine.getSystem('SeasonSystem');
    
    this.scoreText.setText(
      `Fuel: ${stats.fuel.toFixed(0)}\n` +
      `Moves: ${stats.moves}\n` +
      `Time: ${this.timeElapsed.toFixed(1)}s\n` +
      `Director: ${director.getCurrentPersonality()}\n` +
      `Season: ${season.getCurrentSeason()}\n` +
      `Difficulty: ${(this.difficulty * 100).toFixed(0)}%`
    );
  }

  endGame(won, evaluation = null) {
    this.gameState = won ? 'won' : 'failed';
    
    const replay = this.engine.getSystem('ReplaySystem');
    replay.stopRecording();
    
    const scoring = this.engine.getSystem('ScoringSystem');
    const garage = this.engine.getSystem('GarageSystem');
    
    let finalScore = 0;
    if (won && evaluation) {
      finalScore = scoring.computeFinalScore(evaluation, this.timeElapsed);
      console.log('Final score breakdown:', finalScore.breakdown);
      garage.recordScore(this.engine.seed, finalScore.final);
    }
    
    // Show result
    this.resultOverlay.setVisible(true);
    this.resultText.setVisible(true);
    this.resultText.setText(
      won ? `PARKED!\nScore: ${finalScore.final.toFixed(0)}` : 'FAILED\nPress R to retry'
    );
    
    // Play sound
    const audio = this.engine.getSystem('AudioSystem');
    audio.playSound(won ? 'success' : 'fail');
  }

  restart() {
    // Reset wheel steering angle
    this.currentSteerAngle = 0;
    // Reset scene
    this.scene.restart();
  }
  
  triggerParkingBrake() {
    if (this.gameState !== 'playing') return;
    
    const physics = this.engine.getSystem('CarPhysicsSystem');
    const parking = this.engine.getSystem('ParkingSystem');
    const scoring = this.engine.getSystem('ScoringSystem');
    const carState = physics.getCarState();
    
    // Check if car is stopped
    if (Math.abs(carState.velocity) > 10) {
      // Flash a warning that car must be stopped
      this.showTemporaryMessage('Stop the car first!', '#e74c3c');
      return;
    }
    
    // Evaluate parking
    const evaluation = parking.evaluateParking(carState);
    
    // Debug logging
    console.log('Parking evaluation:', evaluation);
    console.log('Car state:', carState);
    console.log('Scoring stats:', scoring.getStats());
    
    if (parking.checkWin(carState, evaluation)) {
      this.endGame(true, evaluation);
    } else {
      // Show feedback on why parking failed
      const feedback = this.getParkingFeedback(evaluation);
      this.showTemporaryMessage(feedback, '#e67e22');
    }
  }
  
  getParkingFeedback(evaluation) {
    if (evaluation.positionScore < 50) {
      return 'Position too far from center';
    } else if (evaluation.angleScore < 50) {
      return 'Angle not aligned';
    } else {
      return 'Not quite in the spot';
    }
  }
  
  showTemporaryMessage(text, color) {
    const msg = this.add.text(400, 200, text, {
      fontSize: '24px',
      color: color,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    // Fade out and remove after 2 seconds
    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
      delay: 500,
      onComplete: () => msg.destroy()
    });
  }
}
