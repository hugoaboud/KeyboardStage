var THREEx = THREEx || {}

THREEx.VolumetricSpotLight = function( beam, shadow, color, intensity, distance, angle, penumbra, decay ) {

	THREE.SpotLight.call( this, color, intensity, distance, angle, penumbra, decay );
	this.matrixAutoUpdate = true;
	
	this.castShadow = shadow;
	
	this.shadow.mapSize.width = 1024;
	this.shadow.mapSize.height = 1024;
	
	var geometry = new THREE.CylinderGeometry(0, 1, 1, 16, 2, false);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
	this.cone = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {color: color, opacity:beam, transparent:true} ) );
	
	this.add( this.cone );
		
	this.update();
}

THREEx.VolumetricSpotLight.prototype = Object.create( THREE.SpotLight.prototype );
THREEx.VolumetricSpotLight.prototype.constructor = THREEx.VolumetricSpotLight;

THREEx.VolumetricSpotLight.prototype.dispose = function () {

	this.cone.geometry.dispose();
	this.cone.material.dispose();

};

THREEx.VolumetricSpotLight.prototype.update = function ()
{

	var c = new THREE.Color();
	c.copy(this.color);
	//c.multiplyScalar(this.intensity);
	this.cone.material.color.copy( c );
	this.cone.material.opacity = this.intensity/10;

	var coneLength = this.distance ? this.distance : 100;
	var coneWidth = coneLength * Math.tan( this.angle);
	this.cone.scale.set( coneWidth, coneWidth, coneLength );
	this.lookAt( this.target.position );
};