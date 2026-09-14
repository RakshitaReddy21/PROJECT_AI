import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { spacesService } from '../services/spaces.service';
import { projectsService } from '../services/projects.service';
import { materialsService } from '../services/materials.service';

describe('Spaces, Projects & Materials Processing', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('creates a new space and updates the space catalog', async () => {
    const space = await spacesService.createSpace({
      name: 'Robotics & Control Systems',
      description: 'Kinematics, PID controllers, and SLAM algorithms.',
      color: '#4A6FA5',
    });

    expect(space.id).toBeDefined();
    expect(space.name).toBe('Robotics & Control Systems');

    const spaces = await spacesService.getSpaces();
    expect(spaces.some((s) => s.id === space.id)).toBe(true);
  });

  it('creates a project with target learning goal linked to a parent space', async () => {
    const space = (await spacesService.getSpaces())[0];
    const project = await projectsService.createProject({
      spaceId: space.id,
      title: 'HNSW Graph Theory',
      description: 'Understanding navigable small-world graphs for vector retrieval.',
      targetGoal: 'Implement 2-layer skip list graph in Rust.',
    });

    expect(project.id).toBeDefined();
    expect(project.spaceId).toBe(space.id);
    expect(project.targetGoal).toContain('Implement 2-layer');

    const goal = await projectsService.getLearningGoal(project.id);
    expect(goal).toBeDefined();
    expect(goal!.title).toBe(project.targetGoal);
  });

  it('initiates asynchronous material upload and processing pipeline', async () => {
    const projectId = 'proj-1';
    const file = {
      name: 'hnsw_indexing_deep_dive.pdf',
      size: 3200000,
      type: 'application/pdf',
    };

    const material = await materialsService.uploadMaterial(projectId, file);

    expect(material.id).toBeDefined();
    expect(material.projectId).toBe(projectId);
    expect(material.fileName).toBe(file.name);
    expect(material.stage).toBe('uploading');
    expect(material.progress).toBeGreaterThan(0);

    const materials = await materialsService.getMaterials(projectId);
    expect(materials.some((m) => m.id === material.id)).toBe(true);
  });

  it('retries failed or stalled material processing safely', async () => {
    const projectId = 'proj-1';
    const materials = await materialsService.getMaterials(projectId);
    const targetMat = materials[0];

    const retried = await materialsService.retryMaterial(targetMat.id);
    expect(retried.id).toBe(targetMat.id);
    expect(retried.stage).toBe('uploading');
  });

  it('enforces strict project isolation for materials and concepts', async () => {
    const proj1Materials = await materialsService.getMaterials('proj-1');
    const proj2Materials = await materialsService.getMaterials('proj-2');

    // No material from proj-1 should leak into proj-2
    const proj1Ids = new Set(proj1Materials.map((m) => m.id));
    for (const m of proj2Materials) {
      expect(proj1Ids.has(m.id)).toBe(false);
    }
  });
});
