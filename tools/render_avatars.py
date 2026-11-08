import bpy, math, os
from mathutils import Vector
root='/Users/aibasis/Documents/deepseek-harness/default-workspace/AI_Market_Game/packages/web/public/assets/mixamo'
names=['arissa','medea-by-m-arrebola','aj','alex','claire','ty','akai-e-espiritu','lola-b-styperek']
for name in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(root,name+'.glb'))
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name != 'Icosphere']
    for o in bpy.context.scene.objects:
        if o.name == 'Icosphere':
            o.hide_render = True
    pts=[]
    for o in objs:
        pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn=Vector((min(p.x for p in pts),min(p.y for p in pts),min(p.z for p in pts)))
    mx=Vector((max(p.x for p in pts),max(p.y for p in pts),max(p.z for p in pts)))
    center=(mn+mx)/2; h=mx.z-mn.z; w=max(mx.x-mn.x,mx.y-mn.y)
    cam_data=bpy.data.cameras.new('Cam'); cam=bpy.data.objects.new('Cam',cam_data); bpy.context.scene.collection.objects.link(cam)
    cam_data.type='ORTHO'; cam_data.ortho_scale=max(h*1.08,w*1.5)
    cam.location=(center.x, center.y-4, center.z)
    cam.rotation_euler=(math.pi/2,0,0)
    bpy.context.scene.camera=cam
    for loc,energy in [((3,-3,4),1800),((-3,-2,3),900),((0,2,4),1200)]:
        ld=bpy.data.lights.new('L','AREA'); ld.energy=energy; ld.size=4
        lo=bpy.data.objects.new('L',ld); lo.location=loc; lo.rotation_euler=(math.radians(55),0,math.radians(180)); bpy.context.scene.collection.objects.link(lo)
    world=bpy.data.worlds.new('W'); world.use_nodes=True; world.node_tree.nodes['Background'].inputs[0].default_value=(0.08,0.09,0.1,1); world.node_tree.nodes['Background'].inputs[1].default_value=0.5; bpy.context.scene.world=world
    scene=bpy.context.scene
    scene.render.engine='BLENDER_EEVEE_NEXT'
    scene.render.film_transparent=True
    scene.render.resolution_x=512; scene.render.resolution_y=768; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
    scene.render.filepath=os.path.join(root,'portraits',name+'.png')
    scene.eevee.taa_render_samples=24
    bpy.ops.render.render(write_still=True)
    print('WROTE',name)
